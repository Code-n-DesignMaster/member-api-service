const { get } = require('lodash');
const logger = require('../../helpers/logger');
const { NotAllowed, NotFound } = require('@sp/nodejs-utils').errors;

const createPublished = require('./createPublished');
const publishedMetaInfo = require('../shared/publishedMetaInfo');
const apiComponent = require('../../api/apiComponent');

const memberApi = apiComponent.getApi('member');
const editorApi = apiComponent.getApi('editor');
const frontendAppApi = apiComponent.getApi('frontendApp');
const siteHostingUpdater = apiComponent.getApi('siteHostingUpdater');

const workersApi = require('../../api').WorkersApi;
const domainApi = require('../../api').DomainApi;
const ecommerceApi = require('../../api').EcommerceApi;
const memberApiRep = require('../../app/repositories/memberApiRepository');
const ecommerceV2Api = require('../../api/EcommerceApiService/v2');

const {
  ProjectMapper,
  PublishedProjectMapper,
  ProjectSettingsMapper,
  ProjectPageHistoryMapper,
  ProjectFaviconMapper,
  AccountsSubscriptionsMapper
} = require('../../app/classes/mappers');

const { PublishSpecification } = require('../../app/classes/specifications');
const { DomainFactory } = require('../../app/factories');

const { projectPublished } = memberApi.account;

const debug = require('debug')('app:controller:Project:publish');

module.exports = (req, res, next) => {
  const { userId } = req;
  const { projectId } = req.params;
  const isDify = req.body.dify !== undefined;

  let primaryDomain;

  // sent task to save snapshot
  workersApi.saveProjectSnapshot(projectId).catch((err) => { logger.error(err.message) });

  Promise
    .all([
      ProjectMapper.populate({ _id: projectId, userId, deleted: false }, '', ['domains', 'template', 'projectTemplate']),
      PublishedProjectMapper.one({ projectId }, 'mergedStatus'),
      ProjectMapper.count({ userId, published: true, deleted: false }),
      isDify ? req.account.limits.maxAllowedSites : memberApi.account.maxAllowedSites(req.memberApiAccessToken),
      AccountsSubscriptionsMapper.one({userId})
    ])
    .then(([project, publishedProject, publishedCount, maxAllowedSites, subscription]) => {
      if (!subscription) return Promise.reject(new NotFound('CANT_PUBLISH_ON_SUBSCRIPTION'));

      const isTrial = subscription.isTrial();
      const publishOnTrial = subscription.getPublishOnTrial();

      if (isTrial && publishOnTrial === 'disabled') {
        return Promise.reject(new NotAllowed('CANT_PUBLISH_TRIAL_LIMIT'));
      }

      if (!PublishSpecification.isSatisfiedBy(project, publishedProject, publishedCount, maxAllowedSites)) {
        return Promise.reject(new NotAllowed('CANT_PUBLISH_SITES_LIMIT'));
      }

      if (!project.domains.length) {
        return Promise.reject(new NotFound('NO_ATTACHED_DOMAIN'));
      }

      primaryDomain = DomainFactory.createPublishDomain(project.domains, req.body.domainId);

      if (!primaryDomain) {
        return Promise.reject(new NotFound('NO_PRIMARY_DOMAIN'));
      }

      if (isTrial && (publishOnTrial && publishOnTrial.startsWith('free.')) && (primaryDomain.getType() !== 'free')) {
        return Promise.reject(new NotAllowed('CANT_PUBLISH_TRIAL_LIMIT'));
      }

      if (project.eCommerce) {
        try {
          let domainUrl = `http${primaryDomain.isSsl() ? 's' : ''}://${primaryDomain.getNewName() || primaryDomain.getName() }`;
          domainUrl = (primaryDomain.getType() === 'free')
            ? domainUrl + `.${req.user.reseller.domain}`
            : domainUrl;

          const payload = { generalInfo: { storeUrl: domainUrl } };

          ecommerceApi.updateStoreProfile(req.params.projectId, payload, req.userId, req.accessToken);
        } catch (error) {
          logger.error('ecommerceApi.updateStoreUrl:', error);
        }
      }

      return Promise.all([
        frontendAppApi.styles.renderCss(req.params.projectId, req.accessToken),
        createPublished(req),
        publishProject(project),
        publishFavicon(projectId),
        ProjectPageHistoryMapper.remove({ projectId }),
        req.accessToken
          ? domainApi.setPrimaryDomain(projectId, primaryDomain.getId(), { publish: true }, req.accessToken)
          : domainApi.setPrimaryDomainByApiKey(projectId, primaryDomain.getId(), { publish: true }, userId, req.query.apiKey)
      ]);
    })
    .then(([generatedStyles]) => Promise.all([
      generatedStyles,
      memberApi.account.getFreeHosting(req.userId),
    ]))
    .then(([generatedStyles, { body: freeHostingObj }]) => {
      debug('CreatePublished: done');
      if (primaryDomain.getType() === 'custom' || get(freeHostingObj, 'freeHosting.isInternalCluster') === 1) {
        return internalClusterPublish(projectId, primaryDomain, freeHostingObj, generatedStyles);
      } else {
        return freeHostingPublish(projectId, primaryDomain, req, freeHostingObj);
      }
    })
    .then((partnerFreeHosting) => {
      let publishType = (primaryDomain.getType() === 'custom' || (primaryDomain.getType() === 'free' && !partnerFreeHosting)) ? 'dynamic' : 'hosted';

      ecommerceV2Api.updateDomain(projectId, req.userId);

      res.send({ publishType });
    })
    .then(() => {
      if (isDify) {
        projectPublished(req.params.projectId, false, req.userId);
      } else {
        projectPublished(req.params.projectId, req.memberApiAccessToken);
        publishMailLists(req.params.projectId, req.query.ignoreWarnings, req.accessToken);
      }
    })
    .catch(next);
};

function publishProject(project) {
  return ProjectMapper.updateOne({ _id: project._id }, {
    published: true,
    publishedAt: Date.now(),
    firstPublishedAt: project.firstPublishedAt ? project.firstPublishedAt : Date.now(),
    updatesCounter: 0,
    hasChanges: false
  });
}

function publishFavicon(projectId) {
  logger.debug('publishFavicon', {
    projectId,
  });
  const faviconSizes = ["180x180", "32x32", "16x16"];

  return ProjectFaviconMapper.one({ projectId }, 'temp')
    .then((doc) => {
      if (!doc) {
        logger.debug('publishFavicon: favicon not found');
        return;
      }

      let projectFaviconData;
      let faviconMimeType;
      let faviconSize;

      for(const size of faviconSizes) {
        if(doc.temp[size]) {
          faviconSize = size;
          faviconMimeType = doc.temp[size].mimeType.split('/')[1];
          projectFaviconData = doc.temp[size];
          break;
        } else {
          projectFaviconData = {}
        }
      }

      const favicon  = faviconMimeType
          ? `/projects/${ projectId }/favicons/${ projectId }.${ faviconMimeType }?sizes=${ faviconSize }`
          : null;
      const projectBgColor = (get(doc, 'temp.background', false));

      let projectSettingsUpdateQuery = {favicon};

      if (projectBgColor) {
        projectSettingsUpdateQuery.projectBgColor = projectBgColor;
      }

      logger.debug('publishFavicon', {
        projectId,
        temp: doc.temp,
        projectSettingsUpdateQuery,
      });

      return Promise.all([
        ProjectFaviconMapper.updateOne({ projectId }, {
          sizes: doc.temp,
        }),
        ProjectSettingsMapper.updateOne({ project: projectId }, projectSettingsUpdateQuery),
      ]);
    });
}

function publishMailLists(projectId, ignoreWarnings, accessToken) {
  return editorApi.mail.publishLists(projectId, accessToken)
    .catch((error) => {
      if (!ignoreWarnings) {
        return Promise.reject(error);
      }

      return Promise.resolve();
    });
}

function freeHostingPublish(projectId, primaryDomain, req, freeHostingObj) {
  const domainName = primaryDomain.getNewName() || primaryDomain.getName();
  const { freeHosting, reseller } = freeHostingObj;

  return memberApiRep.getLegalStatements(req.user.resellerId)
    .then((statements) => {
      if(freeHosting) {
        debug('freeHosting: true');
        freeHosting.output = freeHosting.publishTransferProtocol || 'sftp';
        freeHosting.port = freeHosting.port || 22;
        freeHosting.rootFolder = `${ domainName }.${ reseller.dynamicSubdomain || reseller.dynamicSubdomain }`;
        freeHosting.loginUrl = `//${ reseller.domain }` ;
        freeHosting.statements = statements;

        debug('Send publish to bundler');
        // ---------------------
        publishedMetaInfo.onProjectPublish(projectId, primaryDomain);
        workersApi.publish(projectId, freeHosting);
        // ---------------------
        return true;
      }

      debug('freeHosting: false');
      return false;
    });
}

function internalClusterPublish(projectId, primaryDomain, freeHostingObj, generatedStyles) {
  debug('Publish to custom of free reseller domain');

  let domainUrl = primaryDomain.getNewName() || primaryDomain.getName();
  domainUrl = (primaryDomain.getType() === 'free')
    ? domainUrl + `.${freeHostingObj.reseller.dynamicSubdomain}`
    : domainUrl;

  return PublishedProjectMapper.one({ projectId })
    .then((doc) => {
      doc.domain = domainUrl;
      delete doc.__v;
      return siteHostingUpdater.publish(doc, { generatedStyles });
    })
    .then(() => false);
}

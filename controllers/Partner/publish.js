'use strict';

const _ = require('lodash');

const config = require('../../config');
const logger = require('../../helpers/logger');

const { MemberApi } = require('@sp/nodejs-utils/api');
const { NotAllowed, NotFound } = require('@sp/nodejs-utils').errors;
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const subdomainApp = apiComponent.getApi('frontendApp');

const workersApi = require('../../api').WorkersApi;
const ecommerceApi = require('../../api').EcommerceApi;
const ecommerceV2Api = require('../../api/EcommerceApiService/v2');
const memberApiRep = require('../../app/repositories/memberApiRepository');

const getRedirectLoginUrl = require('../shared/getRedirectLoginUrl');
const publishedMetaInfo = require('../shared/publishedMetaInfo');
const createPublished = require('../Projects/createPublished');

const models = require('@sp/mongoose-models');
const AccountsInfo = models.AccountsInfo;
const Project = models.Project;
const ProjectPageHistory = models.ProjectPageHistory;
const ProjectFavicon = models.ProjectFavicon;
const PartnerFavicons = models.PartnerFavicons;
const ProjectSettings = models.ProjectSettings;
const ProjectDomain = models.ProjectDomain;
const PublishedProject = models.PublishedProject;

const rootFolder = 'public_html';
const projectPublished = memberApi.account.projectPublished;

const {
  AccountsSubscriptionsMapper
} = require('../../app/classes/mappers');

const debug = require('debug')('app:controller:Partner:publish');

module.exports = (req, res, next) => {
  let project;
  let maxAllowedSites;
  let hosting;
  let primaryDomain;
  let resellerDomainName;

  const userId = req.userId;

  const projectId = req.params.projectId;
  const query = {
    _id: projectId,
    userId: userId,
    deleted: false
  };

  let subscriptions = req.account.subscriptions.filter(s => ['active', 'renewal_due'].includes(s.status));
  const subscriptionId = (req.body.dify === undefined) ? subscriptions[0].productId : req.body.dify.subscriptionId;
  let subscription;
  let domainId;

  // sent task to save snapshot
  workersApi.saveProjectSnapshot(projectId).catch((err) => { logger.err(err.message) });

  return AccountsSubscriptionsMapper.one({userId, status: {$in:['active', 'renewal_due']}})
    .then((_subscription) => {
      subscription = _subscription;

      let callstack = [
        getResellerDomain(req.user.resellerId),
        getAccountHosting(subscriptionId, userId),
      ];


      if(req.body.domainId) {
        callstack.push(ProjectDomain.findOne({_id:req.body.domainId, type: 'partner', deleted: {$ne: true}}).lean())
      } else {
        callstack.push(ProjectDomain.findOne({userId, type: 'partner', deleted: {$ne: true}}).lean());
      }

      return Promise.all(callstack);
    })
    .then(([resellerDomain, result, domain]) => {
      debug('ResellerDomain: ', resellerDomain);

      if (!domain) return Promise.reject(new NotFound('NO_DOMAIN_FOUND'));
      if (!subscription) return Promise.reject(new NotFound('CANT_PUBLISH_ON_SUBSCRIPTION'));

      domainId = domain._id;

      const isTrial = subscription.isTrial();
      const publishOnTrial = subscription.getPublishOnTrial();
      const publishPartnerDomainOnly = getPublishPartnerDomainOnly(subscription);

      debug('isTrial: ', isTrial);
      debug('publishOnTrial: ', publishOnTrial);

      if (isTrial && publishOnTrial === 'disabled') {
        return Promise.reject(new NotAllowed('CANT_PUBLISH_TRIAL_LIMIT'));
      }

      if (isTrial && (publishOnTrial && publishOnTrial.startsWith('free.')) && (domain.type !== 'free')) {
        return Promise.reject(new NotAllowed('CANT_PUBLISH_TRIAL_LIMIT'));
      }

      if (!result.body.host) {
        return Promise.reject(new NotAllowed('CANT_PUBLISH_ON_SUBSCRIPTION'));
      }

      resellerDomainName = resellerDomain;

      result.body.rootFolder = result.body.rootFolder || rootFolder;
      result.body.output = result.body.publishTransferProtocol || 'sftp';
      result.body.port = result.body.port || 22;
      result.body.type = result.body.type || '';

      hosting = result.body;
      hosting.loginUrl = hosting.loginUrl || `//${ resellerDomain }`;

      if(publishPartnerDomainOnly && publishPartnerDomainOnly === "true") {
        debug('publishPartnerDomainOnly', publishPartnerDomainOnly);
        return Project.find({userId, published: true})
          .then((projects) => {
            if(projects) {
              let callstack =[];
              projects.map((project) => {
                callstack.push(Promise.all([
                  unpublishProject(project._id),
                  invalidateProjectCss(project._id)
                ]))
              });
              return Promise.all(callstack);
            }
          });
      }
    })
    .then(() => memberApiRep.getLegalStatements(req.user.resellerId))
    .then((statements) => {
      hosting.statements = statements;
    })
    .then(() => getAccountPermission(req.memberApiAccessToken, req.userId))
    .then(result => {
      hosting.loginUrl = getRedirectLoginUrl(result.body.settingsCategory);
      return getProject(query);
    })
    .then(result => {
      project = result;
      return Promise.resolve();
    })
    .then(() => {
      if (req.body.dify === undefined) {
        return getMaxAllowedSites(req.memberApiAccessToken)
      } else {
        return req.account.limits.maxAllowedSites;
      }
    })
    .then(result => {
      debug('maxAllowedSites', result);
      maxAllowedSites = result;
      return getPublishedProjectsCount(req.userId);
    })
    .then(publishedProjectsCount => checkIfAllowedToPublish(project, publishedProjectsCount, maxAllowedSites))
    .then(() => attachDomainToProject(domainId, projectId))
    .then(() => getProject(query)) // WORKAROUND!!!!
    .then((result) => {
      debug('getProject', result._id);
      project = result;
      return setPrimaryDomainForProject(project, domainId);
    })
    .then((_primaryDomain) => {
      primaryDomain = _primaryDomain;
      const query = { _id: domainId, userId: req.userId };
      const update = { project: projectId };
      return updateDomain(query, update);
    })
    .then((result) => {
      if (!result) {
        return Promise.reject({
          statusCode: 404,
          body: {
            type: 'not-found',
            message: 'User domain not found'
          }
        })
      }
    })
    .then(() => publishProject(project))
    .then(() => getPartnerId(query.userId))
    .then(partnerId => publishFavicon(query._id, partnerId))
    .then(() => removeHistory(query._id))
    // .then(() => fileStorageService.storage.deleteHiddenFiles(req.accessToken, query._id))
    .then(() => createPublished(req))
    .then(() => {
      debug('Send partner publish to bundler', hosting.hostingId, hosting.output);
      // -----------------------
      publishedMetaInfo.onProjectPublish(projectId, primaryDomain);
      return workersApi.publish(query._id, hosting);
      // -----------------------
    })
    .then(() => {
      debug('CreatePublished: done');

      if (project.eCommerce) {
        try {
          let domainUrl = `http${primaryDomain.ssl ? 's' : ''}://${primaryDomain.newName || primaryDomain.name}`;
          domainUrl = (primaryDomain.type === 'free')
            ? domainUrl + `.${resellerDomainName}`
            : domainUrl;
          const payload = { generalInfo: { storeUrl: domainUrl } };

          ecommerceApi.updateStoreProfile(projectId, payload, req.userId);
        } catch(error) {
          logger.error('ecommerceApi.updateStoreUrl:', error)
        }
      }

      ecommerceV2Api.updateDomain(projectId, req.userId);

      res.send({
        publishType: primaryDomain.type === 'free' ? 'dynamic' : 'hosted',
        type: primaryDomain.type,
        link: (primaryDomain.type === 'free') ? `${primaryDomain.newName || primaryDomain.name}.${resellerDomainName}` : `${primaryDomain.newName || primaryDomain.name}`,
        ssl: primaryDomain.ssl
      });
    })
    .then((result) => {
      if (req.body.dify === undefined) {
        renderProjectCss(projectId, req.accessToken);
        projectPublished(projectId, req.memberApiAccessToken);
      } else {
        projectPublished(projectId, false, req.userId);
        renderProjectCss(projectId, req.accessToken);
      }
    })
    .catch(error => next(error));
};

function getPublishPartnerDomainOnly(subscription) {
  const feature = subscription.features.find(f => f.technicalName === 'publishPartnerDomainOnly');
  return feature && feature.featureValue;
}

function getResellerDomain(id) {
  return (new MemberApi(config.apiUrls.member, config.apiKeys.memberApi)).getReseller(id).then(doc => doc.domain);
}

function getMaxAllowedSites(accessToken) {
  return memberApi.account.maxAllowedSites(accessToken);
}

function getAccountHosting(subscription, userId) {
  return memberApi.account.getHosting(subscription, userId);
}

function getAccountPermission(accessToken, userId) {
  return memberApi.account.getAccountPermission(accessToken, userId);
}

function getPublishedProjectsCount(userId) {
  return new Promise((resolve, reject) => {
    const query = {
      userId,
      published: true,
      deleted: false
    };
    return Project.count(query, (error, count) => {
      if (error) {
        return reject(error);
      }

      resolve(count);
    });
  });
}

function checkIfAllowedToPublish(project, publishedProjectsCount, maxAllowedSitesCount) {
  debug('checkIfAllowedToPublish');
  return new Promise((resolve, reject) => {
    if (project.published === true) {
      debug('checkIfAllowedToPublish:projectPublished', true);
      return resolve();
    }

    if (publishedProjectsCount >= maxAllowedSitesCount) {
      debug('checkIfAllowedToPublish:publishedProjectsCount >= maxAllowedSitesCount', true);
      return reject(new NotAllowed('CANT_PUBLISH_SITES_LIMIT'));
    }

    resolve();
  });
}

function getProject(query) {
  return new Promise((resolve, reject) => {
    Project
      .findOne(query)
      .populate('domains')
      .lean()
      .exec((error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(new NotFound('PROJECT_NOT_FOUND'));
        }

        resolve(result);
      });
  });
}

function publishProject(project) {
  return new Promise((resolve, reject) => {
    const query = {
      _id: project._id
    };
    const update = {
      published: true,
      publishedAt: Date.now(),
      firstPublishedAt: project.firstPublishedAt ? project.firstPublishedAt : Date.now(),
      updatesCounter: 0,
      hasChanges: false
    };
    Project
      .updateOne(query, update)
      .then(resolve)
      .catch(error => {
        return reject(error);
      });
  });
}

function getPartnerId(_id) {
  return AccountsInfo.findOne({_id})
    .select('-_id resellerId')
    .lean()
    .then(doc => doc.resellerId)
    .catch(error => {
      return Promise.reject(error);
    })
}

function publishFavicon(projectId, partnerId) {
  const faviconSizes = ["180x180", "32x32", "16x16"];
  return ProjectFavicon.findOne({projectId})
    .select('temp')
    .lean()
    .then((doc) => {
      if (!doc || !Object.keys(doc.temp).length) {
        return getPartnerFavicon(partnerId);
      }
      return doc;
    })
    .then((doc) => {
      if (!doc) {
        return Promise.all([
          ProjectFavicon.updateOne({projectId}, {sizes: {}}),
          ProjectSettings.updateOne({project: projectId}, {favicon: null})
        ]);
      } else {
        let faviconMimeType;
        let faviconSize;

        for (const size of faviconSizes) {
          if (doc.temp[size]) {
            faviconSize = size;
            faviconMimeType = doc.temp[size].mimeType.split('/')[1];
            break;
          }
        }

        const favicon = faviconMimeType ? `/projects/${ projectId }/favicons/${ projectId }.${ faviconMimeType }?sizes=${ faviconSize }` : null;
        const projectBgColor = (_.get(_.get(doc, 'temp'), 'background', false));

        let projectSettingsUpdateQuery = {favicon};
        if (projectBgColor) {
          projectSettingsUpdateQuery.projectBgColor = projectBgColor;
        }

        return Promise.all([
          ProjectFavicon.updateOne({projectId}, {sizes: doc.temp}),
          ProjectSettings.updateOne({project: projectId}, projectSettingsUpdateQuery)
        ]);
      }
    })
    .catch(error => {
      logger.error(error);
      return Promise.resolve({});
    })
}

function getPartnerFavicon(partnerId) {
  return PartnerFavicons
    .findOne({partnerId})
    .select('-_id temp')
    .lean()
    .then(partnerFaviconDoc => partnerFaviconDoc)
    .catch(error => {
      logger.error(error);
      return Promise.resolve({});
    });
}

function setPrimaryDomainForProject(project, domainId) {
  return new Promise((resolve, reject) => {
    const domains = project.domains;
    const setValue = {isPrimary: true};

    if (!domains.length) {
      return reject(new NotFound('NO_ATTACHED_DOMAIN'));
    }

    let primaryDomain;

    if (domainId) {
      primaryDomain = domains.find(domain => domain._id === domainId);
    } else {
      primaryDomain = domains.find(domain => domain.isPrimary === true);
      domainId = !primaryDomain ? domains[0]._id : primaryDomain._id;
    }

    if (!primaryDomain) {
      return reject(new NotFound('NO_PRIMARY_DOMAIN'));
    }

    primaryDomain = primaryDomain || domains[0];

    if (primaryDomain.newName !== null) {
      setValue.name = primaryDomain.newName;
      setValue.newName = null;
      setValue.newNameReservedAt = null;
    }

    const callStack = [
      ProjectDomain.updateOne(
        {
          _id: primaryDomain._id
        }, {
          $set: setValue
        }),
      ProjectDomain.updateMany({project: project._id, _id: {$ne: domainId}}, {isPrimary: false})
    ];

    Promise
      .all(callStack)
      .then(() => resolve(primaryDomain))
      .catch(error => {
        reject(error);
      });
  });
}

function renderProjectCss(projectId, accessToken) {
  return new Promise((resolve) => {
    subdomainApp.styles.renderCss(projectId, accessToken);
    return resolve({});
  });
}

function removeHistory(projectId) {
  return ProjectPageHistory.find({projectId}).remove().exec();
}

function updateDomain(query, update) {
  debug("updateDomain");
  return new Promise((resolve, reject) => {
    ProjectDomain.findOneAndUpdate(
      query,
      update,
      (error, result) => {
        if (error) {
          logger.error(error);
          return reject({
            statusCode: 500,
            body: {
              type: 'system',
              message: 'Cannot update user domain'
            }
          });
        }

        resolve(result);
      })
  });
}

function attachDomainToProject(domainId, projectId) {
  debug("attachDomainToProject");
  return new Promise((resolve, reject) => {
    Project.updateOne(
      {_id: projectId},
      {
        // $push: { domains: domainId }
        $addToSet: { domains: { $each: [ domainId ] } } // will not insert duplicates as $push
      },
      (error) => {
        if (error) {
          debug("attachDomainToProject error", error);
          logger.error(error);

          return reject({
            statusCode: 500,
            body: {
              type: 'system',
              message: 'Cannot attach domain to project',
            },
          });
        }

        return resolve({});
      });
  });
}

// update DB methods

function unpublishProject(projectId) {
  let callStack = [];

  callStack.push(new Promise((resolve, reject) => {
    const query = { _id: projectId };
    const update = { $set: { published: false } };
    Project.updateOne(query, update, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve();
    });
  }));

  callStack.push(new Promise((resolve, reject) => {
    const query = { projectId: projectId};
    const update = {$set: { subscriptionId: 0, mergedStatus: 'undefined' }};
    PublishedProject.updateOne(query, update, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve();
    });
  }));

  return Promise.all(callStack);
}

function invalidateProjectCss(projectId) {
  return subdomainApp.styles.invalidate(projectId);
}

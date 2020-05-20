const models = require('@sp/mongoose-models');

const publishedMetaInfo = require('./publishedMetaInfo');
const responses = require('../../utils/responses');
const getRedirectLoginUrl = require('./getRedirectLoginUrl');
const apiComponent = require('../../api/apiComponent');
const { NotAllowed } = require('@sp/nodejs-utils').errors;

const workersApi = require('../../api').WorkersApi;
const memberApi = apiComponent.getApi('member');
const subdomainApp = apiComponent.getApi('frontendApp');
const siteHostingUpdater = apiComponent.getApi('siteHostingUpdater');

const Project = models.Project;
const PublishedProject = models.PublishedProject;

const debug = require('debug')('app:controller:shared:ProjectUnpublishMethod');

module.exports = (userId, projectId, subscriptionId, project) => {
  return getHosting(userId, projectId, subscriptionId, project)
    .then(hosting => {
      debug('Hosting:', hosting);

      if (hosting === 'dynamic') return;
      if (hosting === 'custom' || hosting === 'internalCluster') return siteHostingUpdater.unpublish({ projectId });

      if (!hosting.host) {
        return Promise.reject(new NotAllowed(`HOSTING_NOT_FOUND`));
      }

      hosting.rootFolder = hosting.rootFolder || 'public_html';
      hosting.output = hosting.publishTransferProtocol || 'sftp';
      hosting.port = hosting.port || 22;
      hosting.type = hosting.type || '';

      return hostedUnpublish(userId, projectId, hosting);
    })
    .then(() => unpublishProject(projectId))
    .then(() => invalidateProjectCss(projectId))
};

function getHosting(userId, projectId, subscriptionId, project) {
  let primaryDomain;
  // Get primary domain type
  if (project.domains.length > 0) {
    primaryDomain = project.domains.find(domain => domain.isPrimary === true);
    primaryDomain = primaryDomain ? primaryDomain : project.domains[0];
  }

  switch (primaryDomain.type) {
    case 'free':
      return freeUnpublish(userId, primaryDomain);
    case 'partner':
      return partnerUnpublish(userId, subscriptionId);
    case 'custom':
      return customUnpublish();
  }

}

function freeUnpublish(userId, primaryDomain) {
  return memberApi.account.getFreeHosting(userId)
    .then((result) => {
      const { freeHosting, reseller } = result.body;

      if (!freeHosting) {
        return 'dynamic';
      }

      if (freeHosting && freeHosting.isInternalCluster === 1) {
        return 'internalCluster';
      }

      let hosting = freeHosting;
      hosting.rootFolder = `${ primaryDomain.name }.${ reseller.dynamicSubdomain }`;

      return hosting;
    });
}

function partnerUnpublish(userId, subscriptionId) {
  return memberApi.account.getHosting(subscriptionId, userId)
    .then((result => result.body))
}

function customUnpublish() {
  return Promise.resolve('custom');
}

function hostedUnpublish(userId, projectId, hosting) {
  return memberApi.account.getAccountPermission(null, userId)
    .then((result) => {
      hosting.loginUrl = getRedirectLoginUrl(result.body.settingsCategory);
      // ------------------
      publishedMetaInfo.onProjectUnpublish(projectId);
      return workersApi.unpublish(projectId, hosting);
      // ------------------
    })
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



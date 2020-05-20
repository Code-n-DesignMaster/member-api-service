'use strict';

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const workersApi = require('../../api').WorkersApi;

const getRedirectLoginUrl = require('../shared/getRedirectLoginUrl');

module.exports = (req, res) => {
  const projectId = req.params.projectId;
  const { domain: unpublishDomain, partnerFreeHosting, resellerDomain } = req.body;

  res.send({});

  if (!unpublishDomain) { return null; }

  let hosting;

  return memberApi.account.getHosting(req.account.subscriptions[0].productId, req.userId)
    .then((result) => {

      if (unpublishDomain.type !== 'partner' && partnerFreeHosting) {
        result.body = partnerFreeHosting;
        result.body.rootFolder = `${ unpublishDomain.name }.${ resellerDomain }`;
      }

      if (!result.body.host) {
        return Promise.reject(responses.onNotAllowed(`Cannot unpublish project ${req.params.projectId} on form subscription ${req.account.subscriptions[0].productId}`));
      }

      result.body.rootFolder = result.body.rootFolder || 'public_html';
      result.body.output = result.body.publishTransferProtocol || 'sftp';
      result.body.port = result.body.port || 22;
      result.body.type = result.body.type || '';

      hosting = result.body;
    })
    .then(() => memberApi.account.getAccountPermission(req.memberApiAccessToken))
    .then(result => {
      hosting.loginUrl = getRedirectLoginUrl(result.body.settingsCategory);

      return workersApi.unpublish(projectId, hosting);
    })
    .catch(err => console.error('unpublishFromDomain Error:', err));

};

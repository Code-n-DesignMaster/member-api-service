'use strict';

const config = require('../../config');
const logger = require('../../helpers/logger');
const responses = require('../../utils/responses');
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const editorSocketApi = apiComponent.getApi('socket');

const models = require('@sp/mongoose-models');
const AccessToken = models.AccessToken;

module.exports = (req, res) => {
  const callStack = [
    memberApiAuthDestroy(req.memberApiAccessToken),
    editorSocketApiLogout(req.accessToken)
  ];

  let redirectUrl = config.urlPrefixes.frontendApp;

  Promise
    .all(callStack)
    .then(results => {
      redirectUrl = results[0].body.redirectUrl;
      removeFromDb(req.accessToken);
    })
    .then(() => {
      responses.onSuccess(res, { redirectUrl });
    })
    .catch(errors => {
      logger.error(errors);
      removeFromDb(req.accessToken);
      responses.onSuccess(res, { redirectUrl });
    });
};

function memberApiAuthDestroy(memberApiAccessToken) {
  return memberApi.auth.destroy(memberApiAccessToken);
}

function removeFromDb(accessToken) {
  return AccessToken
    .findByIdAndRemove(accessToken)
    .catch(error => {
      logger.error(error);
    });
}

function editorSocketApiLogout(accessToken) {
  return editorSocketApi.auth.destroy(accessToken);
}

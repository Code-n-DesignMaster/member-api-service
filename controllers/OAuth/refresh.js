'use strict';

const OAuthFactory = require('./shared/OAuthFactory');
const response = require('./shared/response');

const config = require('../../config');
const request = require('../../utils/request');

const memberApiUrl = config.apiUrls.member;
const memberApiKey = config.apiKeys.memberApi;

module.exports = function (req, res, next) {
  const { vendor, projectId } = req.params;
  let {resellerId} = req.query;
  let credentialType = 'oauthStorage';

  resellerId = resellerId || 1;

  if(vendor === 'mailchimp') {
    credentialType = 'oauth';
  }

  return request(`${memberApiUrl}/reseller/${resellerId}/credential/${credentialType}/${vendor}?apiKey=${memberApiKey}`, {
    method: "GET",
    json: true
  })
  .then(settings => {
    const oauth = OAuthFactory(vendor, req.accessToken, projectId, resellerId, settings.body);
    oauth.storeRefreshedServiceToken()
      .then((token) => res.send(token))
      .catch(error => {
        next(error);
      });
  });
};

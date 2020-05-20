'use strict';

const OAuthFactory = require('./shared/OAuthFactory');
const response = require('./shared/response');

const config = require('../../config');
const request = require('../../utils/request');

const memberApiUrl = config.apiUrls.member;
const memberApiKey = config.apiKeys.memberApi;

module.exports = function (req, res) {
  const vendor = 'flickr';
  const projectId = req.query.projectId;
  let resellerId = 1;

  return request(`${memberApiUrl}/reseller/${resellerId}/credential/oauthStorage/${vendor}?apiKey=${memberApiKey}`, {
    method: "GET",
    json: true
  })
    .then(settings => {
      const oauth = OAuthFactory(vendor, req.accessToken, projectId, resellerId, settings.body);
      oauth.storeServiceToken(req.query)
        .then((email) => res.send(response.access(vendor, email)))
        .catch((err) => {
          res.send(response.fail(err, vendor))
        })
    });
};

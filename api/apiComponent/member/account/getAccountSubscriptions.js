'use strict';

const config = require('../../../../config');
const memberApiKey = config.apiKeys.memberApi;
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (accessToken, userId, customUrl = null) => {
    const request = components.request;

    let url = customUrl || memberApiUrl + '/account/subscriptions';
    const options = {
      method: 'GET'
    };

    if (!accessToken) {
      url = memberApiUrl + `/account/${ userId }/subscription?api_key=${ memberApiKey }`;
    }

    return request(url, options, accessToken);
  };

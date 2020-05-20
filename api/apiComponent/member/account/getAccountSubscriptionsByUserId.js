'use strict';

const config = require('../../../../config');
const memberApiKey = config.apiKeys.memberApi;
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (userId, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + '/account/' + userId + '/subscription?apiKey=' + memberApiKey;
    const options = {
      method: 'GET'
    };

    return request(url, options);
  };

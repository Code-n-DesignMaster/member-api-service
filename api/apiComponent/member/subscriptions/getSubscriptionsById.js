'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (planId, accessToken, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + '/subscriptions/' + planId;
    const options = {
      method: 'GET'
    };

    return request(url, options, accessToken);
  };

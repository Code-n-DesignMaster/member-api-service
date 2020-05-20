'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (accessToken, id, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + '/onboarding/' + id;
    const options = {
      method: 'GET'
    };

    return request(url, options, accessToken);
  };

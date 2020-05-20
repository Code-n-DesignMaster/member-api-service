'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (accessToken, body, id, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + '/onboarding/' + id + '/step';
    const options = {
      method: 'POST',
      json: true,
      body
    };

    return request(url, options, accessToken);
  };

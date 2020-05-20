'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (accessToken, body) => {
    const request = components.request;

    const url = memberApiUrl + '/account/enque-email';
    const options = {
      method: 'POST',
      body,
      json: true
    };

    return request(url, options, accessToken);
  };

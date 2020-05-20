'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (memberApiAccessToken) => {
    const request = components.request;

    const options = {
      method: 'GET'
    };

    return request(`${memberApiUrl}/account/template-setting`, options, memberApiAccessToken);
  };

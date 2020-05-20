'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (data, accessToken, customUrl = null) => {
    const { request } = components;

    const url = customUrl || memberApiUrl + '/account/email/verify';
    const options = {
      method: 'POST',
      body: data,
      json: false
    };

    return request(url, options, accessToken);
  };

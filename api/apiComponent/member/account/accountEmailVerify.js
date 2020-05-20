'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (data, accessToken, customUrl = null) => {
    const { request } = components;

    const url = customUrl || memberApiUrl + '/account/email/verify?auth=true';
    const options = {
      method: 'PUT',
      body: data,
      json: false
    };

    return request(url, options, accessToken);
  };

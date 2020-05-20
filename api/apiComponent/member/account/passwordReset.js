'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (data, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + '/account/password-reset';
    const options = {
      method: 'POST',
      body: data,
      json: false
    };

    return request(url, options);
  };

'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (data, auth = false, customUrl = null) => {
    const request = components.request;
    const authParam = auth ? '?auth=true' : '';

    const url = customUrl || memberApiUrl + '/account/password-reset' + authParam;
    const options = {
      method: 'PUT',
      body: data,
      json: false
    };

    return request(url, options);
  };

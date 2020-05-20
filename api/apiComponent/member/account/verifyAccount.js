'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (id, accessToken, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + '/account/verify';
    const options = {
      method: 'PUT',
      json: false
    };

    return request(url, options, accessToken);
  };

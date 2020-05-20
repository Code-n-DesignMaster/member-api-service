'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (accessToken, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + '/account/dashboard/exist';
    const options = {
      method: 'GET',
      json: false
    };

    return request(url, options, accessToken);
  };

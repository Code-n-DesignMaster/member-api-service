'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (accessToken, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + '/auth';
    const options = {
      method: 'DELETE',
      json: false
    };

    return request(url, options, accessToken);
  };

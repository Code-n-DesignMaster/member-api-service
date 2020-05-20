'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (userId, body) => {
    const request = components.request;

    const url = `${ memberApiUrl }/platform/plan`
    const options = {
      method: 'GET',
      json: true,
    };

    return request(url, options);
  }

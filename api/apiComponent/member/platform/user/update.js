'use strict';

const config = require('../../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (userId, body) => {
    const request = components.request;

    const url = `${ memberApiUrl }/platform/user/${ userId }`
    const options = {
      method: 'PUT',
      json: true,
      body
    };

    return request(url, options);
  }

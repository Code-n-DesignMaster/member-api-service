'use strict';

const config = require('../../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (body) => {
    const request = components.request;

    const url = `${ memberApiUrl }/platform/user/email-check`
    const options = {
      method: 'POST',
      json: true,
      body
    };

    return request(url, options);
  }

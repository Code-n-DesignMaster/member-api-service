'use strict';

const config = require('../../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (partnerId, body) => {
    const request = components.request;

    const url = `${ memberApiUrl }/platform/partner/${ partnerId }`
    const options = {
      method: 'PUT',
      json: true,
      body
    };

    return request(url, options);
  }

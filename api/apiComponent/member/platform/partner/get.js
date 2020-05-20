'use strict';

const config = require('../../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (partnerId) => {
    const request = components.request;

    const url = `${ memberApiUrl }/platform/partner/${ partnerId }`
    const options = {
      method: 'GET',
      json: true,
    };

    return request(url, options);
  }

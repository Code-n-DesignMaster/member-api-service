'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (memberId, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + '/auth?noPassword=true';
    const options = {
      method: 'POST',
      body: {
        memberId
      },
      json: false
    };

    return request(url, options);
  };

'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (email, password, metadata = {}, customUrl = null) => {
    const request = components.request;

    const body = {
      email,
      password,
      metadata: {}
    };

    if (typeof metadata === 'string') {
      customUrl = metadata;
    }
    else {
      body.metadata = metadata;
    }

    const url = customUrl || memberApiUrl + '/auth';
    const options = {
      method: 'POST',
      body,
      json: false
    };

    return request(url, options);
  };

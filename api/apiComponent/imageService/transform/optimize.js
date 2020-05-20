'use strict';

const config = require('../../../../config');
const imageServiceUrl = config.apiUrls.imageService;

module.exports = (components) =>
  (data, customUrl = null) => {
    const request = components.request;

    const url = customUrl || imageServiceUrl + '/scripts/optimize';
    const options = {
      method: 'POST',
      body: data,
      json: false
    };

    return request(url, options);
  };

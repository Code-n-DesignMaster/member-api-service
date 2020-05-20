'use strict';

const config = require('../../../../config');
const imageServiceUrl = config.apiUrls.imageService;

module.exports = (components) =>
  (customUrl = null) => {
    const request = components.request;

    const url = customUrl || imageServiceUrl + '/scripts/resize';
    const options = {
      method: 'POST',
      json: false
    };

    return request(url, options);
  };

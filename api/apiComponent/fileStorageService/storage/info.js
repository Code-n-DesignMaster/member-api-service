'use strict';

const config = require('../../../../config');
const fileStorageServiceUrl = config.apiUrls.fileStorageService;

module.exports = (components) =>
  (accessToken, customUrl = null) => {
    const request = components.request;

    const url = customUrl || fileStorageServiceUrl + '/info';
    const options = {
      method: 'GET'
    };

    return request(url, options, accessToken);
  };

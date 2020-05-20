'use strict';

const config = require('../../../../config');
const fileStorageServiceUrl = config.apiUrls.fileStorageService;

module.exports = (components) =>
  (storagePath, resolution, customUrl = null) => {
    const request = components.request;

    const url = customUrl || fileStorageServiceUrl + `/${storagePath}` + '/thumbnails' + `/${resolution}`;
    const options = {
      method: 'GET'
    };

    return request(url, options);
  };

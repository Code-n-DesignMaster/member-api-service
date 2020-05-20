'use strict';

const config = require('../../../../config');
const fileStorageServiceUrl = config.apiUrls.fileStorageService;

module.exports = (components) =>
  (accessToken, projectId, customUrl = null) => {
    const request = components.request;

    const url = customUrl || fileStorageServiceUrl + '/projects/' + projectId + '/files';
    const options = {
      method: 'PUT'
    };

    return request(url, options, accessToken);
  };

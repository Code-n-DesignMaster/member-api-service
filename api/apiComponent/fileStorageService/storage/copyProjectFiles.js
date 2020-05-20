'use strict';

const config = require('../../../../config');
const fileStorageServiceUrl = config.apiUrls.fileStorageService;

module.exports = (components) =>
  (parentProjectId, projectId, accessToken, customUrl = null) => {
    const request = components.request;

    const url = `${ customUrl || fileStorageServiceUrl }/projects/${ parentProjectId }/files/copy/${ projectId }`;
    const options = {
      method: 'PUT'
    };

    return request(url, options, accessToken);
  };

'use strict';

const config = require('../../../../config');
const imageServiceUrl = config.apiUrls.imageService;

module.exports = (components) =>
  (templateId, projectId, accessToken, customUrl = null) => {
    const request = components.request;

    const url = customUrl || imageServiceUrl + `/projects/${ projectId }/icons/merge/${ templateId }`;
    const options = {
      method: 'PUT'
    };

    return request(url, options, accessToken);
  };

'use strict';

const config = require('../../../../config');
const imageServiceUrl = config.apiUrls.imageService;

module.exports = (components) =>
  (template, projectId, accessToken, customUrl = null) => {
    const request = components.request;

    const url = customUrl || imageServiceUrl + `/projects/${ template }/copy/${ projectId }`;
    const options = {
      method: 'PUT'
    };

    return request(url, options, accessToken);
  };

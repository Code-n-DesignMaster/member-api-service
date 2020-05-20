'use strict';

const config = require('../../../../config');
const imageServiceUrl = config.apiUrls.imageService;

module.exports = (components) =>
  (template, projectId, apiKey, customUrl = null) => {
    const request = components.request;

    const url = customUrl || imageServiceUrl + `/partner/projects/${ template }/copy/${ projectId }?apiKey=${ apiKey  }`;
    const options = {
      method: 'PUT'
    };

    return request(url, options);
  };

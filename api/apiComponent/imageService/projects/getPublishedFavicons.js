'use strict';

const config = require('../../../../config');
const imageServiceUrl = config.apiUrls.imageService;

module.exports = (components) =>
  (projectId, customUrl = null) => {
    const request = components.request;

    const url = customUrl || imageServiceUrl + '/projects/' + projectId + '/publishedFavicons';
    const options = {
      method: 'GET'
    };

    return request(url, options);
  };

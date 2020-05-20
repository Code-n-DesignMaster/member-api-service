'use strict';

const config = require('../../../../config');
const editorServiceUrl = config.apiUrls.editorService;

module.exports = (components) =>
  (projectId, accessToken, customUrl = null) => {
    const request = components.request;

    const url = customUrl || `${editorServiceUrl}/mail/${projectId}/lists/publish`;
    const options = {
      method: 'POST',
    };

    return request(url, options, accessToken);
  };

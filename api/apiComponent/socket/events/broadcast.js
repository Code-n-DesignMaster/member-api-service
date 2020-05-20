'use strict';

const config = require('../../../../config');
const editorSocketService = config.apiUrls.editorSocketService;

module.exports = (components) =>
  (projectId, body) => {

    const request = components.request;
    const options = {
      method: 'POST',
      body,
      qs: {
        apiKey: config.apiKeys.servicesApiKey,
      }
    };

    return request(`${editorSocketService}/broadcast/project/${projectId}`, options);
  };

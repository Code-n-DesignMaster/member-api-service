'use strict';

const config = require('../../../../config');
const editorServiceUrl = config.apiUrls.editorService;

module.exports = (components) =>
  (projectId, vendor, body) => {
    const request = components.request;

    const url = `${editorServiceUrl}/mail/${projectId}/send/${vendor}`;
    const options = {
      method: 'POST',
      body,
    };

    return request(url, options);
  };

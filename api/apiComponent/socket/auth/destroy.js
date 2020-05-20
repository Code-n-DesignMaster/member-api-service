'use strict';

const config = require('../../../../config');
const editorSocketService = config.apiUrls.editorSocketService;

module.exports = (components) =>
  (accessToken, customUrl = null) => {
    const request = components.request;

    const url = customUrl || editorSocketService + '/auth';
    const options = {
      method: 'DELETE'
    };

    return request(url, options, accessToken);
  };

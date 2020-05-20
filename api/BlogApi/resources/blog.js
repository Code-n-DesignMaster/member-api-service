'use strict';

const serviceRequest = require('../serviceRequest');

module.exports.getSettings = (blogId) => serviceRequest.get({
  url: `/blog/${blogId}/blog-setting`,
  headers: {
    'Siteplus-Blog-Api-Key': serviceRequest.apiKey
  }
});

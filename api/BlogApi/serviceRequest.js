const baseRequest = require('../baseRequest');

const config = require('../../config');
const baseUrl = config.apiUrls.blogApi;
const apiKey = config.apiKeys.blogApiKey;

const serviceRequest = baseRequest.defaults({
  baseUrl: baseUrl,
  json: true
});

serviceRequest.apiKey = apiKey;

module.exports = serviceRequest;

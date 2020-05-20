'use strict';

const config = require('../../../../config');
const subdomainAppUrl = config.apiUrls.subdomainApp;
const servicesApiKey = config.apiKeys.servicesApiKey;

module.exports = (components) =>
  (projectId, accessToken) => {
    const request = components.request;

    const url = accessToken
      ? subdomainAppUrl + `/styles/${ projectId }.css`
      : subdomainAppUrl + `/styles/${ projectId }.css?apiKey=${ servicesApiKey }`;

    const options = {
      method: 'DELETE'
    };

    return request(url, options, accessToken);
  };

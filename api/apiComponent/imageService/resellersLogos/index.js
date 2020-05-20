'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;
const memberApiKey = config.apiKeys.memberApi;

module.exports = (components) =>
  (accessToken, customUrl = null) => {
    const request = components.request;

    let url = customUrl || memberApiUrl + `/setting/category/branding?apiKey=${ memberApiKey }`;
    const options = {
      method: 'GET'
    };

    return request(url, options, accessToken);
  };

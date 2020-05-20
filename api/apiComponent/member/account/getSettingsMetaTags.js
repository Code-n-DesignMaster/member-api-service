'use strict';

const config = require('../../../../config');
const memberApiKey = config.apiKeys.memberApi;
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (userId, accessToken, customUrl = null) => {
    const request = components.request;

    let url = customUrl || memberApiUrl + `/setting/category/metaTags?apiKey=${ memberApiKey }&memberId=${ userId }`;
    const options = {
      method: 'GET'
    };

    return request(url, options, accessToken);
  };

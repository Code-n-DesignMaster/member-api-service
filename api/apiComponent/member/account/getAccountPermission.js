'use strict';

const config = require('../../../../config');
const memberApiKey = config.apiKeys.memberApi;
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (accessToken, userId) => {
    const request = components.request;

    const url = accessToken
      ? memberApiUrl + `/account/permission`
      : memberApiUrl + `/account/permission?apiKey=${ memberApiKey }&memberId=${ userId }`;

    const options = {
      method: 'GET'
    };

    return request(url, options, accessToken);
  };

'use strict';

const config = require('../../../../config');
const memberApiKey = config.apiKeys.memberApi;
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (projectId, accessToken, userId, customUrl = null) => {
    const request = components.request;

    let url = customUrl || memberApiUrl + '/account/project/' + projectId;
    const options = {
      method: 'PUT',
      body: {
        isPublished: true
      },
      json: false
    };

    if (!accessToken) {
      url += `?apiKey=${ memberApiKey }&memberId=${ userId }`;
    }

    return request(url, options, accessToken);
  };

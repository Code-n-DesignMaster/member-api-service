'use strict';

const config = require('../../../../config');
const logger = require('../../../../helpers/logger');
const memberApiKey = config.apiKeys.memberApi;
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (projectId, accessToken, userId, customUrl = null) => {
    const request = components.request;

    let url = customUrl || memberApiUrl + '/account/project';
    const options = {
      method: 'POST',
      body: {
        objectId: projectId,
        isPublished: false
      },
      json: false
    };

    if (!accessToken) {
      url += `?apiKey=${ memberApiKey }&memberId=${ userId }`;
    }

    return request(url, options, accessToken)
      .catch(logger.error);
  };

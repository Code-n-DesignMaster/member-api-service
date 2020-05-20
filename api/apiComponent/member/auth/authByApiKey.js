'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (memberId) => {
    const request = components.request;
    const options = {
      method: 'POST',
      body: { memberId },
      json: true
    };

    return request(`${memberApiUrl}/auth?noPassword=true&apiKey=${config.apiKeys.memberApi}`, options);
  };

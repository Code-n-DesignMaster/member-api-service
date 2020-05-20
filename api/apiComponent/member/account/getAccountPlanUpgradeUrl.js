'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports =
  (components) =>
    (accessToken) => {
      const request = components.request;
      const url = memberApiUrl + '/setting/plan-upgrade-url';
      const options = { method: 'GET' };

      return request(url, options, accessToken);
    };

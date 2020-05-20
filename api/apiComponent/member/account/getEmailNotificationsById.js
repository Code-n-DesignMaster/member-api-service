'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (emailId, accessToken, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + '/account/email-notifications/' + emailId;
    const options = {
      method: 'GET'
    };

    return request(url, options, accessToken);
  };

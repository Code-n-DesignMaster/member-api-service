'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (userId, apiKey, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + `/account/${ userId }/subscription?api_key=${ apiKey }`;
    const options = {
      method: 'GET'
    };

    return request(url, options);
  };

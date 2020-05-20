'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (orderId, accessToken, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + '/account/orders/' + orderId;
    const options = {
      method: 'GET'
    };

    return request(url, options, accessToken);
  };

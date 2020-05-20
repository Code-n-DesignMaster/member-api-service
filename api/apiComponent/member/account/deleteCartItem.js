'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (cartItem, accessToken, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + '/account/cart/' + cartItem;
    const options = {
      method: 'DELETE'
    };

    return request(url, options, accessToken);
  };

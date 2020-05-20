'use strict';

const _ = require('lodash');
const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (data, accessToken, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + '/account/cart';
    const body = _.pick(data, ['cartItemType', 'productId', 'addonId', 'planId', 'periodId']);
    const options = {
      method: 'POST',
      body,
      json: true
    };

    return request(url, options, accessToken);
  };

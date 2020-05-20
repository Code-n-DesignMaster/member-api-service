'use strict';

const _ = require('lodash');
const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;

module.exports = (components) =>
  (data, customUrl = null) => {
    const request = components.request;

    const url = customUrl || memberApiUrl + '/account';
    const body = _.pick(data, ['email', 'password', 'fullName', 'firstName', 'lastName']);
    const options = {
      method: 'POST',
      body,
      json: false
    };

    return request(url, options);
  };

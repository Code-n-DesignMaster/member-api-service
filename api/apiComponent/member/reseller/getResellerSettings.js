'use strict';

const { Request } = require('@sp/nodejs-utils').classes;
const config = require('../../../../config');

const request = new Request(config.apiUrls.member).setApiKey(config.apiKeys.memberApi).freezy();

module.exports = () =>
  (resellerId, setting) => {

    return request.exec({
      endpoint: `/reseller/${resellerId}/setting/category/${ setting }`,
      cache: true,
    }).then(r => r.body);
  };

'use strict';

const config = require('../../../../config');
const memberApiUrl = config.apiUrls.member;
const request = require('request');

module.exports = (components) =>
  (req, res) => {

    const options = {
      uri: `${ memberApiUrl }/platform/cv`,
      method: 'POST',
      strictSSL: (config.env === 'production'),
    };

    req.pipe(request(options)).pipe(res);
  }

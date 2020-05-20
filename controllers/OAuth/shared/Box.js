'use strict';

const _ = require('lodash');
const qs = require('querystring');

const request = require('../../../utils/request');

const {boxAuth, boxToken, boxAccount} = require('./endpoints');
const Base = require('./Base');

module.exports = class Box extends Base {

  constructor(vendor, token, projectId, resellerId, settings) {
    const params = qs.stringify({
      client_id: settings.clientId,
      redirect_uri: settings.callbackUrl,
      response_type: "code"

    });
    super(vendor, token, projectId, resellerId, settings, boxAuth, params);
  }

  /**
   * Get service token
   * @param  {Object} options
   * @return {Promise}
   */
  getServiceToken(options) {
    return request(boxToken, {
      method: "POST",
      body: {
        client_id: this.settings.clientId,
        client_secret: this.settings.clientSecret,
        redirect_uri: this.settings.callbackUrl,
        code: options.code,
        grant_type: "authorization_code"
      },
      json: false
    })
      .then(result => ({
        accessToken: _.get(result, 'body.access_token'),
        refreshToken: _.get(result, 'body.refresh_token'),
        valid: true,
      }));
  }

  refreshServiceToken(refreshToken) {
    return request(boxToken, {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      json: false,
      body: {
        client_id: this.settings.clientId,
        client_secret: this.settings.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      },
    });
  }

  getUserEmail(token) {
    return request(boxAccount, {
      headers: {
        Authorization: `Bearer ${ token.accessToken }`
      }
    })
      .then(result => result.body.login)
  }
};

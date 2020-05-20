'use strict';

const _ = require('lodash');
const qs = require('querystring');

const request = require('../../../utils/request');

const {googleToken, googleAuth, googleAccount} = require('./endpoints');
const Base = require('./Base');

module.exports = class Google extends Base {

  constructor(vendor, token, projectId, resellerId, settings) {
    const params = qs.stringify({
      client_id: settings.clientId,
      redirect_uri: settings.callbackUrl,
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email',
      response_type: 'code',
      prompt: 'consent',
    });
    super(vendor, token, projectId, resellerId, settings, googleAuth, params);
  }

  /**
   * Get service token
   * @param  {Object} options
   * @return {Promise}
   */
  getServiceToken(options) {

    return request(googleToken, {
      method: "POST",
      body: {
        client_id: this.settings.clientId,
        client_secret: this.settings.clientSecret,
        redirect_uri: this.settings.callbackUrl,
        code: options.code,
        grant_type: 'authorization_code'
      },
      json: false
    })
      .then(result => ({
        accessToken: _.get(result, 'body.access_token'),
        refreshToken: _.get(result, 'body.refresh_token'),
        valid: true,
      }));
  }

  getUserEmail(token) {
    return request(googleAccount, {
      headers: {
        Authorization: `Bearer ${ token.accessToken }`
      }
    })
      .then(result => result.body.emails[0].value)
  }

  refreshServiceToken(refreshToken) {
    return request(googleToken, {
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
}

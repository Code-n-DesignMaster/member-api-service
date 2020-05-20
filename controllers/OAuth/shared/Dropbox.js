'use strict';

const _ = require('lodash');
const qs = require('querystring');

const request = require('../../../utils/request');

const {dropboxAuth, dropboxToken, dropboxAccount} = require('./endpoints');
const Base = require('./Base');

module.exports = class Dropbox extends Base {

  constructor(vendor, token, projectId, resellerId, settings) {
    const params = qs.stringify({
      client_id: settings.clientId,
      redirect_uri: settings.callbackUrl,
      response_type: "code"
    });
    super(vendor, token, projectId, resellerId, settings, dropboxAuth, params);
  }

  /**
   * Get service token
   * @param  {Object} options
   * @return {Promise}
   */
  getServiceToken(options) {
    return request(dropboxToken, {
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
        body: {account_id: _.get(result, 'body.account_id')},
        valid: true,
      }));
  }

  getUserEmail(token, body) {
    return request(dropboxAccount, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ token.accessToken }`
      },
      body: {
        account_id: body.account_id
      }
    })
      .then(result => result.body.email)
  }

}

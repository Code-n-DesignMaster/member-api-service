'use strict';

const qs = require('querystring');

const request = require('../../../utils/request');

const {mailchimpToken, mailchimpAuth, mailchimpMetadata, mailchimpAccount} = require('./endpoints')
const Base = require('./Base');

module.exports = class Mailchimp extends Base {

  constructor(vendor, token, projectId, resellerId, settings) {
    const params = qs.stringify({
      client_id: settings.clientId,
      redirect_uri: settings.callbackUrl,
      response_type: 'code',
    });
    super(vendor, token, projectId, resellerId, settings, mailchimpAuth, params);
  }

  /**
   * Get service token
   * @param  {Object} options
   * @return {Promise}
   */
  getServiceToken(options) {
    let token = null;

    return request(mailchimpToken, {
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
      .then((result) => {
        token = result;

        return this.getUserDC(result.body.access_token);
      })
      .then((result) => ({
        accessToken: `${result.body.dc}-${token.body.access_token}`,
        body: {email: result.body.login.email},
        valid: true,
      }));
  }

  getUserDC(accessToken) {
    return request(mailchimpMetadata, {
      method: "GET",
      headers: {
        'Authorization': `OAuth ${ accessToken }`,
        'Content-Type': 'application/json'
      },
    });
  }

  getUserEmail(token, body) {
    return Promise.resolve(body.email);
  }
}

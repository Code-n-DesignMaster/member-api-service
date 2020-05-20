'use strict';

const _ = require('lodash');
const qs = require('querystring');

const request = require('../../../utils/request');
const logger = require('../../../helpers/logger');

const {instagramAuth, instagramToken, instagramAccount} = require('./endpoints');
const Base = require('./Base');

const models = require('@sp/mongoose-models');
const OAuthToken = models.OAuthToken;

module.exports = class Instagram extends Base {

  constructor(vendor, token, projectId, resellerId, settings) {
    const params = qs.stringify({
      client_id: settings.clientId,
      redirect_uri: settings.callbackUrl,
      response_type: "code"
    });
    super(vendor, token, projectId, resellerId, settings, instagramAuth, params);
  }

  /**
   * Get service token
   * @param  {Object} options
   * @return {Promise}
   */
  getServiceToken(options) {
    return request(instagramToken, {
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
        valid: true,
      }));
  }

  getUserEmail(token) {
    return request(`${ instagramAccount }?access_token=${ token.accessToken }`)
      .then(result => result.body.data.username)
  }

  check() {
    return OAuthToken.findOne({
      projectId: this.projectId,
      vendor: this.vendor,
      valid: true,
    }).then((token) => {
      if(!token) return false;

      return new Promise((resolve) => {
        request(`${ instagramAccount }?access_token=${ token.accessToken }`)
          .then(() => {
            resolve(true);
          })
          .catch((err) => {
            if(err.statusCode === 400 && err.body.meta.error_type === 'OAuthAccessTokenException') {
              resolve(false);
            } else {
              logger.error('Instagram error on check', err);
            }

            resolve(false);
          })
      })
    })
  }

};

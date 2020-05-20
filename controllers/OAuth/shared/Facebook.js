'use strict';

const _ = require('lodash');
const qs = require('querystring');

const request = require('../../../utils/request');

const {facebookAuth, facebookToken, facebookAccount} = require('./endpoints');
const Base = require('./Base');

module.exports = class Facebook extends Base {

  constructor(vendor, token, projectId, resellerId, settings) {
    const params = qs.stringify({
      client_id: settings.clientId,
      redirect_uri: settings.callbackUrl,
      scope: 'user_photos,email'
    });
    super(vendor, token, projectId, resellerId, settings, facebookAuth, params);
  }

  getServiceToken(options) {
    const params = qs.stringify({
      client_id: this.settings.clientId,
      client_secret: this.settings.clientSecret,
      redirect_uri: this.settings.callbackUrl,
      code: options.code
    });

    return request(facebookToken + params)
      .then(result => ({
        accessToken: _.get(result, 'body.access_token'),
        valid: true,
      }));
  }

  getUserEmail(token) {
    return request(`${ facebookAccount }?fields=email`, {
      headers: {
        Authorization: `Bearer ${ token.accessToken }`
      }
    })
      .then(result => result.body.email)
  }

  disconnect() {
    return this.getToken().then((result) => {
      return request(`${facebookAccount}/permissions`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${ result.accessToken }`
        }
      }).then(() => {
        return super.disconnect();
      })
    });
  }

};

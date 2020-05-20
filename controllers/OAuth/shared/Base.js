'use strict';

const _ = require('lodash');

const models = require('@sp/mongoose-models');
const OAuthToken = models.OAuthToken;

module.exports = class Base {
  constructor(vendor, token, projectId, resellerId, settings, authUrl, authParams) {
    this.vendor = vendor;
    this.token = token;
    this.projectId = projectId;
    this.resellerId = resellerId;
    this.settings = settings;
    this.authUrl = authUrl;
    this.authParams = authParams;
  }

  disconnect() {
    return OAuthToken.findOne({
      projectId: this.projectId,
      vendor: this.vendor
    }).remove();
  }

  check() {
    return OAuthToken.findOne({
      projectId: this.projectId,
      vendor: this.vendor,
      valid: true,
    })
  }

  popup() {
    return Promise.resolve(`${ this.authUrl }${ this.authParams }&state=${ JSON.stringify({
      token: this.token,
      projectId: this.projectId,
      resellerId: this.resellerId
    }) }`);
  }

  upsertToken(data) {
    return OAuthToken.findOneAndUpdate({
        projectId: this.projectId,
        vendor: this.vendor,
      },
      data,
      {upsert: true, new: true});
  }

  getToken() {
    return OAuthToken.findOne({
      projectId: this.projectId,
      vendor: this.vendor
    })
      .select('accessToken refreshToken')
      .lean();
  }

  /**
   * Get service token
   * @param  {Object} options
   * @return {Promise}
   */
  storeServiceToken(options) {
    return this.getServiceToken(options)
      .then(result => {
        return Promise
          .all([
            this.getUserEmail(result, result.body),
            this.upsertToken(result)
          ])
          .then(result => result[0])
      });
  }

  storeRefreshedServiceToken(options) {
    return this.getToken()
      .then(result => {
        const refreshToken = _.get(result, 'refreshToken');

        return this.refreshServiceToken(refreshToken);
      })
      .then(result => {
        const token = {
          accessToken: _.get(result, 'body.access_token'),
        };

        const refreshToken = _.get(result, 'body.refresh_token');

        if (refreshToken) {
          token.refreshToken = refreshToken;
        }

        return this.upsertToken(token);
      });
  }

  refreshServiceToken(options) {
    throw new Error('Provider have not posibility to refresh token!');
  }

  getServiceToken() {
  }
};

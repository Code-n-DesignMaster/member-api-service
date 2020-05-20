'use strict';

const qs = require('querystring');
const FlickrSDK = require('flickr-sdk');

const {flickrAuth, flickrAccessToken, flickrRequestToken} = require('./endpoints');
const Base = require('./Base');

module.exports = class Flickr extends Base {

  constructor(vendor, token, projectId, resellerId, settings) {
    const params = qs.stringify({
      oauth_nonce: 89601180,
      oauth_timestamp: 1305583298,
      oauth_consumer_key: settings.clientId,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_version: 1.0,
      oauth_callback: settings.callbackUrl,
    });
    super(vendor, token, projectId, resellerId, settings, null, params);

    this.oauth = new FlickrSDK.OAuth(
      settings.clientId,
      settings.clientSecret
    );
  }

  getServiceToken(options) {
    return this.oauth.verify(options.oauth_token, options.oauth_verifier, options.tokenSecret)
      .then((response) => ({
        accessToken: response.body.oauth_token,
        tokenSecret: response.body.oauth_token_secret,
        valid: true,
      }));
  }

  getUserEmail(token) {
    const api = new FlickrSDK(FlickrSDK.OAuth.createPlugin(
      this.settings.clientId,
      this.settings.clientSecret,
      token.accessToken,
      token.tokenSecret
    ));
    return api.test.login()
      .then((data) => {
        return data.body.user.username._content;
      });
  }

  popup() {
    let token = {};

    return this.oauth.request(this.settings.callbackUrl)
      .then((response) => {
        token.accessToken = response.body.oauth_token;
        token.tokenSecret = response.body.oauth_token_secret;

        return this.upsertToken(token);
      })
      .then(() => this.oauth.authorizeUrl(token.accessToken));
  }
}

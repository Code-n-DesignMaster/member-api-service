'use strict';

const qs = require('querystring');

const logger = require('../../helpers/logger');
const request = require('../../utils/request');

const models = require('@sp/mongoose-models');
const OAuthAccount = models.OAuthAccount;

const profileUrl = 'https://graph.facebook.com/v2.5/me?';
const getTokenUrl = 'https://graph.facebook.com/v2.8/oauth/access_token?';

const memberApiRep = require('../../app/repositories/memberApiRepository');

module.exports = function (req, res) {
  let account;

  const state = JSON.parse(req.query.state || '{}');

  memberApiRep.getResellerCred(state.resellerId, 'oauth', 'facebook')
    .then(result => {

      const tokenParams = qs.stringify({
        client_id: result.body.clientId,
        client_secret: result.body.clientSecret,
        access_token: req.query.code,
        redirect_uri: result.body.linkCallbackUrl,
        code: req.query.code
      });

      return request(getTokenUrl + tokenParams);
    })
    .then(result => {

      const token = result.body.access_token;
      const profileParams = qs.stringify({
        access_token: token,
        fields: 'name,email'
      });

      return request(profileUrl + profileParams);
    })
    .then(result => {
      account = result;

      return OAuthAccount.findOne({
        oauthAccountId: result.body.id,
        vendor: 'facebook'
      })
        .select('_id')
        .lean();
    })
    .then(doc => {
      if (doc) {
        return Promise.reject({ statusCode: 409 });
      }

      return OAuthAccount.create({
        userId: req.userId,
        vendor: 'facebook',
        oauthAccountId: account.body.id,
        email: account.body.email,
        name: account.body.name
      });
    })
    .then(saved => res.send(`<script type="text/javascript">window.opener.postMessage({code: 200, type: "connected_account"}, "*");window.close()</script>`))
    .catch(error => {
      logger.error(error);
      res.send(`<script type="text/javascript">window.opener.postMessage({code: ${ error.statusCode }, type: "connected_account"}, "*");window.close()</script>`);
    });
};

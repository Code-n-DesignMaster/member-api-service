'use strict';

const logger = require('../../helpers/logger');
const request = require('../../utils/request');

const models = require('@sp/mongoose-models');
const OAuthAccount = models.OAuthAccount;

const memberApiRep = require('../../app/repositories/memberApiRepository');
const profileUrl = 'https://www.googleapis.com/plus/v1/people/me?';
const getTokenUrl = 'https://www.googleapis.com/oauth2/v4/token?';

module.exports = function (req, res) {
  let account;
  const state = JSON.parse(req.query.state || '{}');

  memberApiRep.getResellerCred(state.resellerId, 'oauth', 'google')
    .then(result => {

      const body = {
        client_id: result.body.clientId,
        client_secret: result.body.clientSecret,
        redirect_uri: result.body.linkCallbackUrl,
        code: req.query.code,
        grant_type: 'authorization_code'
      };

      return request(getTokenUrl, {
        method: 'POST',
        body,
        json: false
      });
    })

    .then(result => {
      const token = result.body.access_token;
      return request(profileUrl + 'access_token=' + token)
        .then(result => {
          account = result;

          return OAuthAccount.findOne({
            oauthAccountId: result.body.id,
            vendor: 'google'
          })
            .select('_id')
            .lean();
        })
        .then(doc => {
          if (doc) {
            return Promise.reject({ statusCode: 409 });
          }

          const name = `${ account.body.name.givenName} ${ account.body.name.familyName}`;
          const email = account.body.emails.find(item => item.type === 'account');

          return OAuthAccount.updateOne({
            userId: req.userId,
            vendor: 'google',
            oauthAccountId: account.body.id
          }, {
            email: email.value,
            name: name
          }, {
            upsert: true
          });
        });
    })

    .then(() => res.send('<script type="text/javascript">window.opener.postMessage({code: 200, type: "connected_account"}, "*");window.close();</script>'))
    .catch(error => {
      logger.error(error);
      res.send(`<script type="text/javascript">window.opener.postMessage({code: ${ error.statusCode }, type: "connected_account"}, "*");window.close();</script>`);
    });
};

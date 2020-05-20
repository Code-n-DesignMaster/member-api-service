'use strict';

const geoip = require('geoip-lite');

const logger = require('../../helpers/logger');
const request = require('../../utils/request');
const responses = require('../../utils/responses');
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

const eventSubscriptions = require('../Events/eventWorkers/eventSubscriptions');

const models = require('@sp/mongoose-models');
const OAuthAccount = models.OAuthAccount;
const AccessToken = models.AccessToken;

const memberApiRep = require('../../app/repositories/memberApiRepository');
const profileUrl = 'https://www.googleapis.com/plus/v1/people/me?';
const getTokenUrl = 'https://www.googleapis.com/oauth2/v4/token?';

module.exports = function (req, res) {
  let memberApiAccessToken;
  let country = (req.realIP === '127.0.0.1') ? 'Local' : 'Unknown';

  const lookup = geoip.lookup(req.ip);
  const state = JSON.parse(req.query.state || '{}');

  if (lookup && lookup.country) {
    country = lookup.country;
  }

  memberApiRep.getResellerCred(state.resellerId, 'oauth', 'google')
    .then(result => {

      const body = {
        client_id: result.body.clientId,
        client_secret: result.body.clientSecret,
        redirect_uri: result.body.callbackUrl,
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
          return OAuthAccount.findOne({
            vendor: 'google',
            oauthAccountId: result.body.id
          })
            .lean();
        });
    })
    .then(doc => {
      if (!doc) {
        return Promise.reject({ statusCode: 403 });
      }

      return authenticate(doc.userId);
    })
    .then(result => {
      memberApiAccessToken = result.body.accessToken;
      return getAccountInfo(memberApiAccessToken);
    })
    .then(({ body }) => {
      const data = {
        memberApiAccessToken,
        userId: body.id,
        user: body,
        ipAddress: req.ip,
        metadata: {
          userAgent: req.useragent,
          country
        }
      };
      return createAccessToken(data);
    })
    .then(accessToken => {
      res.send(`<script type="text/javascript">window.opener.postMessage({code: 200, type: "login", accessToken: "${accessToken}"}, "*");window.close();</script>`);
    })
    .catch(error => {
      logger.error(error);
      res.send(`<script type="text/javascript">window.opener.postMessage({code: ${ error.statusCode }, type: "login"}, "*");window.close();</script>`);
    });
};

function authenticate(memberId) {
  return memberApi.auth.attemptWithoutPassword(memberId);
}

function getAccountInfo(memberApiAccessToken) {
  return memberApi.account.getAccountInfo(memberApiAccessToken);
}

function createAccessToken(data) {
  return new Promise((resolve, reject) => {
    AccessToken.create(data, (error, result) => {
      if (error) {
        return reject(responses.onSystemError('Cannot create access token'));
      }
      new eventSubscriptions(data.userId).updateDataWhenLogin();
      resolve(result._id);
    });
  });
}

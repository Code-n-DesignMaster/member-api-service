'use strict';

const qs = require('querystring');
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

const profileUrl = 'https://graph.facebook.com/v2.5/me?';
const getTokenUrl = 'https://graph.facebook.com/v2.8/oauth/access_token?';

const memberApiRep = require('../../app/repositories/memberApiRepository');

module.exports = function (req, res) {
  let memberApiAccessToken;
  let country = (req.realIP === '127.0.0.1') ? 'Local' : 'Unknown';

  const lookup = geoip.lookup(req.ip);
  const state = JSON.parse(req.query.state || '{}');

  if (lookup && lookup.country) {
    country = lookup.country;
  }
  memberApiRep.getResellerCred(state.resellerId, 'oauth', 'facebook')
    .then(result => {
      const tokenParams = qs.stringify({
        client_id: result.body.clientId,
        client_secret: result.body.clientSecret,
        access_token: req.query.code,
        redirect_uri: result.body.callbackUrl,
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
      return OAuthAccount.findOne({
        vendor: 'facebook',
        oauthAccountId: result.body.id
      })
        .lean();
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
      res.send(`<script type="text/javascript">window.opener.postMessage({code: 200, type: "login", accessToken: "${accessToken}" }, "*");window.close()</script>`);
    })
    .catch(error => {
      logger.error(error);
      res.send(`<script type="text/javascript">window.opener.postMessage({code: ${ error.statusCode }, type: "login"}, "*");window.close()</script>`);
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

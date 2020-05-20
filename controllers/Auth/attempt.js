'use strict';

const _ = require('lodash');
const geoip = require('geoip-lite');

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

const eventSubscriptions = require('../Events/eventWorkers/eventSubscriptions');

const models = require('@sp/mongoose-models');
const AccessToken = models.AccessToken;

const debug = require('debug')('app:controller:Auth');

module.exports = async (req, res, next) => {
  try {
    debug('Got request to /auth');

    let memberApiAccessToken;
    let country = (req.realIP === '127.0.0.1') ? 'Local' : 'Unknown';

    const lookup = geoip.lookup(req.realIP);
    if (lookup && lookup.country) {
      country = lookup.country;
    }

    const email = req.body.email;
    const password = req.body.password;
    const rememberMe = req.body.rememberMe;

    const metadata = _.get(req.body, ['resellerId'], {});
    metadata.countryCode = country;
    metadata.ip = req.realIP;
    metadata.userAgent = req.useragent.source;

    const authResult = await memberApi.auth.attempt(email, password, metadata);
    debug('Auth via member-api OK');

    memberApiAccessToken = authResult.body.accessToken;
    let accountInfo = await memberApi.account.getAccountInfo(memberApiAccessToken);
    accountInfo = accountInfo.body;

    const data = {
      memberApiAccessToken,
      userId: accountInfo.id,
      user: accountInfo,
      ipAddress: req.realIP,
      rememberMe,
      metadata: {
        userAgent: req.useragent,
        country
      }
    };

    const accessToken = await createAccessToken(data);
    const responseData  = {accessToken};

    if(accountInfo.reseller && accountInfo.reseller.domain) {
      responseData.ssoUrl = `http://${accountInfo.reseller.domain}/auth-sso?token=${accessToken}`;
    }

    res.send(responseData);
  } catch (err) {
    next(err);
  }
};

function createAccessToken(data) {
  return Promise
    .all([
      new eventSubscriptions(data.userId).updateDataWhenLogin(),
      AccessToken.create(data)
    ])
    .then(results => {
      return results[1]._id;
    })
    .catch(error => Promise.reject(error));
}

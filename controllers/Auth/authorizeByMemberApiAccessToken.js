'use strict';

const geoip = require('geoip-lite');

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

const eventSubscriptions = require('../Events/eventWorkers/eventSubscriptions');

const models = require('@sp/mongoose-models');
const AccessToken = models.AccessToken;

module.exports = (req, res, next) => {
  const lookup = geoip.lookup(req.ip);

  let country = (req.realIP === '127.0.0.1') ? 'Local' : 'Unknown';
  if(lookup && lookup.country) {
      country = lookup.country;
  }

  memberApi.account.getAccountInfo(req.body.token)
    .then(result => {
      const data = {
        memberApiAccessToken: req.body.token,
        userId: result.body.id,
        user: result.body,
        ipAddress: req.ip,
        rememberMe: true,
        metadata: { userAgent: req.useragent, country }
      };
      return createAccessToken(data);
    })
    .then(result => {
      res.send({ accessToken: result.accessToken,  user:result.user });
    })
    .catch(error => {
      next(error);
    });
};

function createAccessToken(data) {
  return new Promise((resolve, reject) => {
    AccessToken
      .findOne({ memberApiAccessToken: data.memberApiAccessToken })
      .select('_id user')
      .lean()
      .then((result) => {
        new eventSubscriptions(data.userId).updateDataWhenLogin();
        if(result) {
          return resolve({
            accessToken: result._id,
            user: result.user
          });
        }
        AccessToken.create(data, (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve({
            accessToken: result._id,
            user: result.user
          });
        });
      })
  });
}

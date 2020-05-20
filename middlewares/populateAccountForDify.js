'use strict';

const config = require('../config');
const populateAccountSubscriptions = require('./populateAccountSubscriptionsAndLimitsByUserId');
const models = require('@sp/mongoose-models');
const promiseOr = require('../helpers/promiseOr');
const apiComponent = require('../api/apiComponent');

const { MemberApi } = require('@sp/nodejs-utils/api');
const { AccountsLimits, AccountsSubscriptions, AccountsInfo } = models;
const memberApi = apiComponent.getApi('member');
const debug = require('debug')('app:md:populateAccountForDify');

module.exports = function (req, res, next) {
  const userId = req.body.dify.memberId;
  req.userId = userId;

  debug('Dify info:', userId, req.body.dify.subscriptionId, req.body.dify.templateId);

  Promise
    .all([
      promiseOr(AccountsInfo.findOne({ _id: userId }), memberApi.account.getAccountInfoByUserId(userId).then(r => r.body)),
      AccountsSubscriptions.find({ userId }),
      AccountsLimits.find({ _id: userId }),
    ])
    .then(([account, subscriptions, limits]) => {
      return (new MemberApi(config.apiUrls.member, config.apiKeys.memberApi)).getReseller(account.resellerId)
        .then(reseller => {
          req.user = account;
          req.user.reseller = reseller;

          if (!subscriptions.length || !limits.length) {
            req.params.userId = userId;
            debug('Need populateAccountSubscriptions', subscriptions.length, limits.length);
            return populateAccountSubscriptions(req, res, next);
          }

          req.account = {
            userId: userId,
            subscriptions: subscriptions,
            limits: limits[0]
          };

          debug('No needs populateAccountSubscriptions', subscriptions.length, limits.length);
          next();
        })
    })
    .catch(next);
};

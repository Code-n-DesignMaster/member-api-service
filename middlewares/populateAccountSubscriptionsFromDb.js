'use strict';

const logger = require('../helpers/logger');
const config = require('../config');

const populateAccountSubscriptions = require('./populateAccountSubscriptionsAndLimitsByUserId');
const promiseOr = require('../helpers/promiseOr');
const apiComponent = require('../api/apiComponent');
const { AuthenticationError } = require('@sp/nodejs-utils').errors;

const models = require('@sp/mongoose-models');
const AccountsInfo = models.AccountsInfo;
const AccountsSubscriptions = models.AccountsSubscriptions;
const AccountsLimits = models.AccountsLimits;
const memberApi = apiComponent.getApi('member');
const { MemberApi } = require('@sp/nodejs-utils/api');

module.exports = function (req, res, next) {
  if (!req.query.userId) {
    return next(new AuthenticationError());
  }

  req.userId = req.query.userId;
  Promise.all([
    promiseOr(AccountsInfo.findOne({ _id: req.userId }), memberApi.account.getAccountInfoByUserId(req.userId).then(r => r.body)),
    AccountsSubscriptions.find({ userId: req.userId }).lean(),
    AccountsLimits.find({ _id: req.userId }).lean(),
  ])
    .then(([account, subscriptions, limits]) => {
      return (new MemberApi(config.apiUrls.member, config.apiKeys.memberApi)).getReseller(account.resellerId)
        .then(reseller => {
          req.user = account;
          req.account = {
            user: req.user,
            userId: req.userId,
            subscriptions: {},
            limits: {}
          };
          req.user.reseller = reseller;

          if (!subscriptions.length || !limits.length) {
            req.params.userId = req.body.dify.memberId;
            return populateAccountSubscriptions(req, res, next);
          }

          req.account.subscriptions = subscriptions;
          req.account.limits = limits[0];

          next();
        })
        .catch(error => {
          return Promise.reject(error);
        });
    })
    .catch(next);
};

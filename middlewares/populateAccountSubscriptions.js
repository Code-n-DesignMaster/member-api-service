'use strict';

const _ = require('lodash');

const logger = require('../helpers/logger');
const { AuthenticationError } = require('@sp/nodejs-utils').errors;

const apiComponent = require('../api/apiComponent');
const memberApi = apiComponent.getApi('member');

module.exports = (req, res, next) => {
  if (!(req.memberApiAccessToken && req.account)) {
    return next(new AuthenticationError());
  }

  memberApi
    .account
    .getAccountSubscriptions(req.memberApiAccessToken)
    .then(response => {
      if (_.isEmpty(response.body)) {
        return Promise.reject('Got empty response body from member api');
      }

      req.account.subscriptions = response.body;

      if (!req.account.subscriptions[0]) {
        return Promise.reject('No account subscription information');
      }

      if (!req.account.subscriptions[0].features) {
        return Promise.reject('No features field in account subscriptions');
      }

      next();
    })
    .catch(next);
};

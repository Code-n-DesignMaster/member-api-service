'use strict';

const logger = require('../../helpers/logger');

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const eventSubscriptions = require('../Events/eventWorkers/eventSubscriptions');

module.exports = (req, res, next) => {
  const userDetails = {};

  if (req.userId === undefined) {
    if (req.query.userId === undefined) {
      return res.send({});
    }
    req.userId = req.query.userId;
  }

  let callStack = [
    memberApi.account.getAccountInfoByUserId(req.userId),
    memberApi.account.getAccountSubscriptionsByUserId(req.userId)
  ];

  if (req.memberApiAccessToken) {
    callStack.push(
      memberApi.account.getAccountContact(req.memberApiAccessToken)
        .catch(error => {
          logger.error(error);
          return Promise.resolve({});
        })
    );

    callStack.push(
      memberApi.account.getSettingsAll(req.userId, req.memberApiAccessToken)
        .catch(error => {
          logger.error(error);
          return Promise.resolve({});
        })
    );
  }

  Promise
    .all(callStack)
    .then(([account, subscriptions, contact, settings]) => {
      userDetails.account = account.body;

      if (contact) {
        userDetails.account.contact = contact.body ? contact.body : {};
      }

      if (settings) {
        userDetails.account.settings = settings.body ? settings.body : {};
      }

      userDetails.subscriptions = subscriptions.body;

      const counter = new eventSubscriptions(false, false, false);
      userDetails.limits = counter._groupLimits(userDetails.subscriptions);

      return res.send(userDetails);
    })
    .catch(next);
};

'use strict';

const _ = require('lodash');

const logger = require('../../helpers/logger');
const responses = require('../../utils/responses');
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

const eventSubscriptions = require('../Events/eventWorkers/eventSubscriptions');

const models = require('@sp/mongoose-models');
const OAuthAccount = models.OAuthAccount;

module.exports = (req, res, next) => {
  const callStack = [
    getAccountInfo(req.memberApiAccessToken),
    getAccountContact(req.memberApiAccessToken),
    getAccountNotificationsSettings(req.memberApiAccessToken),
    getAccountSubscriptions(req.memberApiAccessToken),
    getAccountNewEmailInfo(req.memberApiAccessToken),
    getLinkedAccounts(req.userId)
  ];
  Promise
    .all(callStack)
    .then(results => {

      let result = _.get(results[0], 'body');
      result.contact = _.get(results[1], 'body');
      result.notifications = _.get(results[2], 'body');
      result.subscriptions = _.get(results[3], 'body');
      result.newEmail = _.get(results[4], 'body.newEmail');
      result.emailChanged = !!result.newEmail;
      result.linkedAccounts = results[5];
      result = adapt(result);

      return getAccountLimits(req.memberApiAccessToken, result.subscriptions)
        .then(limits => {
          result.limits = limits;

          const counter = new eventSubscriptions(false, false, false);
          const countedLimits = counter._groupLimits(result.subscriptions);

          result.showAdvertisement = limits.mustShowAdvertisement;

          if (countedLimits.ecommerce) {
            result.limits.ecommerce = countedLimits.ecommerce;
          }

          return Promise.resolve(result);
        })
        .catch(error => {
          return Promise.reject(error);
        });
    })
    .then(result => {
      res.send(result);
    })
    .catch(errors => {
      logger.error(errors);
      const error = (_.isArray(errors)) ? errors[0] : errors;
      next(error);
    });
};

function getAccountInfo(memberApiAccessToken) {
  return memberApi.account.getAccountInfo(memberApiAccessToken);
}

function getAccountContact(memberApiAccessToken) {
  return memberApi.account.getAccountContact(memberApiAccessToken);
}

function getAccountNotificationsSettings(memberApiAccessToken) {
  return memberApi.account.getAccountNotificationSettings(memberApiAccessToken);
}

function getAccountSubscriptions(memberApiAccessToken) {
  return memberApi.account.getAccountSubscriptions(memberApiAccessToken);
}

function getAccountNewEmailInfo(memberApiAccessToken) {
  return memberApi.account.getAccountNewEmailInfo(memberApiAccessToken);
}

function getAccountLimits(memberApiAccessToken, accountSubscription = null) {
  return memberApi.account.getLimits(["sites", "projects", "storage", "advertisement", "pages", "enableFeatures", "enableBlocks", "enableMarginals", "sections"], memberApiAccessToken, accountSubscription)
    .then(results => {
      return {
        maxAllowedSites: results[0],
        maxAllowedProjects: results[1],
        outOfPlanLimit: results[1],
        maxFileStorageSpace: results[2],
        mustShowAdvertisement: results[3],
        maxAllowedPages: results[4],
        enableFeatures: results[5],
        enableBlocks: results[6],
        enableMarginals: results[7],
        maxAllowedSections: results[8]
      }
    });
}

function adapt(data) {
  switch (data.emailContentType) {
    case 'html' :
      data.emailContentType = 0;
      break;
    case 'plain' :
      data.emailContentType = 1;
      break;
  }
  data.emailVerified = data.verified;
  Reflect.deleteProperty(data, 'verified');
  return data;
}

function getLinkedAccounts(userId) {
  return OAuthAccount.find({
    userId
  })
    .select('-_id vendor oauthAccountId email name')
    .lean()
}

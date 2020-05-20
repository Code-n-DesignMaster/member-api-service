'use strict';

const _ = require('lodash');

const config = require('../config');
const logger = require('../helpers/logger');
const { AuthenticationError } = require('@sp/nodejs-utils').errors;

const apiComponent = require('../api/apiComponent');
const memberApi = apiComponent.getApi('member');

const defaultMaxAllowedProjects = config.maxAllowedProjects;

module.exports = (req, res, next) => {
  if (!req.params.userId) {
    return next(new AuthenticationError());
  }

  memberApi
    .account
    .getAccountSubscriptionsByUserId(req.params.userId)
    .then(response => {
      if (_.isEmpty(response.body)) {
        return Promise.reject('Got empty response body from member api');
      }
      req.userId = req.params.userId;
      req.account = {
        userId: req.params.userId,
        subscriptions: {},
        limits: {}
      };

      req.account.subscriptions = response.body;

      if (!req.account.subscriptions[0]) {
        return Promise.reject('No account subscription information');
      }

      if (!req.account.subscriptions[0].features) {
        return Promise.reject('No features field in account subscriptions');
      }
    })
    .then(subscriptions => {
      memberApi.account
        .getLimits(['sites', 'projects', 'storage', 'advertisement', 'pages', 'enableFeatures', 'enableBlocks', 'enableMarginals', 'sections'], false, req.account.subscriptions)
        .then(results => {
          req.account.limits = {
            maxAllowedSites: results[0],
            outOfPlanLimit: results[1],
            maxAllowedProjects: results[1] < defaultMaxAllowedProjects ? defaultMaxAllowedProjects : results[1],
            maxFileStorageSpace: results[2],
            mustShowAdvertisement: results[3] > 0,
            maxAllowedPages: results[4],
            enableFeatures: results[5],
            enableBlocks: results[6],
            enableMarginals: results[7],
            maxAllowedSections: results[8]
          };
          req.account.showAdvertisement = results[3];

          next();
        });
    })
    .catch(next);
};

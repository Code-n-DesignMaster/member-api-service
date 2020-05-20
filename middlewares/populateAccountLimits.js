'use strict';

const _ = require('lodash');

const config = require('../config');
const logger = require('../helpers/logger');
const { AuthenticationError } = require('@sp/nodejs-utils').errors;

const apiComponent = require('../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const getLimits = memberApi.account.getLimits;

const defaultMaxAllowedProjects = config.maxAllowedProjects;

module.exports = (req, res, next) => {

  if (!(req.memberApiAccessToken && req.account)) {
    return next(new AuthenticationError());
  }

  if (_.isEmpty(req.account.subscriptions)) {
    return next();
  }

  getLimits(['sites', 'projects', 'storage', 'advertisement', 'pages', 'enableFeatures', 'enableBlocks', 'enableMarginals', 'sections'], req.memberApiAccessToken, req.account.subscriptions)
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
    })
    .catch(next);
};

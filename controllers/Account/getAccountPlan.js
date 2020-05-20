'use strict';

const _ = require('lodash');
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const logger = require('../../helpers/logger');

module.exports = (req, res, next) => {
  getAccountSubscriptions(req.memberApiAccessToken)
    .then(result => getAccountLimits(req.memberApiAccessToken, result))
    .then(result => {
      res.send(result);
    })
    .catch(errors => {
      logger.error(errors);
      const error = (_.isArray(errors)) ? errors[0] : errors;
      next(error);
    });
};

function getAccountSubscriptions(memberApiAccessToken) {
  return new Promise((resolve, reject) => {
    memberApi.account.getAccountSubscriptions(memberApiAccessToken)
      .then(result => resolve(result.body))
      .catch(reject);
  });
}

function getAccountLimits(memberApiAccessToken, accountSubscription = null) {
  return new Promise((resolve, reject) => {
    const callStack = [
      memberApi.account.maxAllowedProjects(memberApiAccessToken, accountSubscription),
      memberApi.account.maxAllowedSites(memberApiAccessToken, accountSubscription),
      memberApi.account.outOfPlanLimit(memberApiAccessToken, accountSubscription),
      memberApi.account.maxFileStorageSpace(memberApiAccessToken, accountSubscription)
    ];
    Promise.all(callStack)
      .then(results => {
        resolve({
          maxAllowedProjects: results[0],
          maxAllowedSites: results[1],
          outOfPlanLimit: results[2],
          maxFileStorageSpace: results[3]
        });
      })
      .catch(reject);
  });
}

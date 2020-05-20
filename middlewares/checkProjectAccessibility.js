'use strict';

const co = require('co');
const _ = require('lodash');
const { NotAllowed, NotFound } = require('@sp/nodejs-utils').errors;

const apiComponent = require('../api/apiComponent');
const memberApi = apiComponent.getApi('member');

const logger = require('../helpers/logger');

const models = require('@sp/mongoose-models');
const Project = models.Project;

const getProjectsByUserId = require('../helpers/getProjectsByUserId');

module.exports = (req, res, next) => {
  co(function* () {
    const accountSubscriptions = _.get(req, 'account.subscriptions');
    const accountLimits = _.get(req, 'account.limits');

    let outOfPlanLimit = accountLimits.outOfPlanLimit;
    if (!outOfPlanLimit) outOfPlanLimit = yield memberApi.account.outOfPlanLimit(req.memberApiAccessToken, accountSubscriptions);

    yield checkProjectIsValid(req.params.projectId, req.account.limits, req.userId);

    return Promise.resolve();
  })
    .then(() => {
      next();
    })
    .catch(error => {
      next(error);
    });
};

function checkProjectIsValid(projectId, accountLimits, userId) {
  return new Promise((resolve, reject) => {
    const callStack = [
      getProjectsByUserId(userId, accountLimits, { inPlanOnly: true }),
      Project.findOne({_id: projectId, userId, deleted: false}).count()
    ];
    Promise
      .all(callStack)
      .then(([projects, projectByProjectIdCount]) => {
        if (projects.length === 0 || projectByProjectIdCount === 0) {
          return reject(new NotFound('PROJECT_NOT_FOUND'));
        }

        if (!projects.find(project => project._id === projectId)) {
          return reject(new NotAllowed('PROJECT_OUT_OF_PLAN'));
        }

        resolve();
      })
      .catch(reject);
  });
}

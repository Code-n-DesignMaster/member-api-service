'use strict';

const _ = require('lodash');
const logger = require('../../../../helpers/logger');
const responses = require('../../../../utils/responses');

module.exports = (components) => {
  return (accessToken, customAccountSubscriptions = null, customUrl = null, userId = null) => {
    if (_.isString(customAccountSubscriptions)) {
      customUrl = customAccountSubscriptions;
      customAccountSubscriptions = null;
    }
    return new Promise((resolve, reject) => {
      getAccountSubscriptions(components, accessToken, customAccountSubscriptions, customUrl, userId)
        .then(accountSubscriptions => {

          if (!_.isArray(accountSubscriptions)) accountSubscriptions = [accountSubscriptions];

          let outOfPlanLimit = 0,
            projectsFeature = {},
            projectsAddons = [];

          accountSubscriptions.map(accountSubscription => {
            if (accountSubscription.status === 'active' || accountSubscription.status === 'renewal_due') {
              projectsFeature = {};
              projectsAddons = [];

              if (accountSubscription.features && !_.isEmpty(accountSubscription.features)) {
                projectsFeature = accountSubscription.features.find(feature => feature.technicalName === 'projects');
                if (projectsFeature) {
                  outOfPlanLimit += parseInt(projectsFeature.featureValue);
                }
              }

              if (accountSubscription.addons && !_.isEmpty(accountSubscription.addons)) {
                projectsAddons = accountSubscription.addons.filter(addon => addon.feature && addon.feature.technicalName === 'projects' && (addon.status === 'active' || addon.status === 'renewal_due'));
                if (!_.isEmpty(projectsAddons)) {
                  for (const projectsAddon of projectsAddons) {
                    outOfPlanLimit += parseInt(projectsAddon.value);
                  }
                }
              }
            }
          });

          resolve(outOfPlanLimit);
        })
        .catch(reject);
    });
  };
};

function getAccountSubscriptions(components, accessToken, customAccountSubscriptions = null, customUrl = null) {
  const memberApiGetAccountSubscriptions = require('./getAccountSubscriptions')(components);

  return new Promise((resolve, reject) => {
    if (customAccountSubscriptions && !_.isEmpty(customAccountSubscriptions)) {
      return resolve(customAccountSubscriptions);
    }
    memberApiGetAccountSubscriptions(accessToken, customUrl)
      .then(result => {
        if (_.isEmpty(result.body)) {
          return reject('Got empty response body from member api');
        }
        resolve(result.body);
      })
      .catch(error => {
        logger.error(error);
        return reject(responses.onSystemError('Cannot retrieve subscription information for requested account'));
      });
  });
}

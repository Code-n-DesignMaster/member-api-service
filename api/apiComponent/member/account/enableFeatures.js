'use strict';

const _ = require('lodash');
const logger = require('../../../../helpers/logger');
const responses = require('../../../../utils/responses');

module.exports = (components) =>
  (accessToken, customAccountSubscriptions = null, customUrl = null) => {
    if (_.isString(customAccountSubscriptions)) {
      customUrl = customAccountSubscriptions;
      customAccountSubscriptions = null;
    }
    return new Promise((resolve, reject) => {
      getAccountSubscriptions(components, accessToken, customAccountSubscriptions, customUrl)
        .then(accountSubscriptions => {
          if (!_.isArray(accountSubscriptions)) accountSubscriptions = [accountSubscriptions];

          let enableFeatures = false;
          let sitesFeature = {};

          accountSubscriptions.map(accountSubscription => {
            if (accountSubscription.status === 'active' || accountSubscription.status === 'renewal_due') {
              sitesFeature = {};
              if (accountSubscription.features && !_.isEmpty(accountSubscription.features)) {
                sitesFeature = accountSubscription.features.find(feature => feature.technicalName === 'enableFeatures');
                if (sitesFeature) {
                  enableFeatures = enableFeatures || (sitesFeature.featureValue === 'true' || sitesFeature.featureValue === true);
                }
              }
            }
          });

          resolve(enableFeatures);
        })
        .catch(reject);
    });
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

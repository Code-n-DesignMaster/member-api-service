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

          let maxAllowedSections = 0;
          let sitesFeature = {};
          let sitesAddons = {};

          accountSubscriptions.map(accountSubscription => {
            if (accountSubscription.status === 'active' || accountSubscription.status === 'renewal_due') {
              sitesFeature = {};
              sitesAddons = {};

              if (accountSubscription.features && !_.isEmpty(accountSubscription.features)) {
                sitesFeature = accountSubscription.features.find(feature => feature.technicalName === 'sections');
                if (sitesFeature) {
                  maxAllowedSections += parseInt(sitesFeature.featureValue);
                }
              }

              if (accountSubscription.addons && !_.isEmpty(accountSubscription.addons)) {
                sitesAddons = accountSubscription.addons.filter(addon => addon.feature && addon.feature.technicalName === 'sections' && (addon.status === 'active' || addon.status === 'renewal_due'));
                if (!_.isEmpty(sitesAddons)) {
                  for (const sitesAddon of sitesAddons) {
                    maxAllowedSections += parseInt(sitesAddon.value);
                  }
                }
              }
            }
          });
          resolve(maxAllowedSections);
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

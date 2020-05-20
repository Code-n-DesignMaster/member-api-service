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
          if (_.isArray(accountSubscriptions)) accountSubscriptions = accountSubscriptions[0];

          let maxFileStorageSpace = 0;
          let storageFeature = {};
          let storageAddons = {};

          if (accountSubscriptions.features && !_.isEmpty(accountSubscriptions.features)) {
            storageFeature = accountSubscriptions.features.find(feature => feature.technicalName === 'storage');
            if (storageFeature) {
              maxFileStorageSpace = parseInt(storageFeature.featureValue);
            }
          }

          if (accountSubscriptions.addons && !_.isEmpty(accountSubscriptions.addons)) {
            storageAddons = accountSubscriptions.addons.filter(addon => addon.feature && addon.feature.technicalName === 'storage' && (addon.status === 'active' || addon.status === 'renewal_due'));
            if (!_.isEmpty(storageAddons)) {
              for (const storageAddon of storageAddons) {
                maxFileStorageSpace += parseInt(storageAddon.value);
              }
            }
          }

          if (!maxFileStorageSpace) {
            return Promise.reject(responses.onSystemError('Cannot retrieve file storage limits for requested account'));
          }

          resolve(maxFileStorageSpace);
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

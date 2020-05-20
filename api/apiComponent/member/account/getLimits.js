'use strict';

const accountSubscriptions = require('./getAccountSubscriptions');

const subscriptionsMap = {
  advertisement: (feature) => {
    return feature.featureValue === 'true' || feature.featureValue === true;
  },
  enableBlocks: (feature) => {
    return feature.featureValue === 'true' || feature.featureValue === true;
  },
  enableFeatures: (feature) => {
    return feature.featureValue === 'true' || feature.featureValue === true;
  },
  enableMarginals: (feature) => {
    return feature.featureValue === 'true' || feature.featureValue === true;
  }
};

module.exports = function (components) {
  const getAccountSubscriptions = accountSubscriptions(components);

  return function (subscriptionNames, accessToken, customAccountSubscriptions = null) {

    const getSubscriptions = customAccountSubscriptions
      ? Promise.resolve(customAccountSubscriptions)
      : getAccountSubscriptions(accessToken)
        .then(result => result.body);

    return getSubscriptions
      .then(accountSubscriptions => {

        // ["sites", "projects", "storage", "advertisement", "pages", "enableFeatures", "enableBlocks", "enableMarginals", "sections"] -> shared-components-for-service/middlewares/populateAccountLimits.js
        const limits = [0, 0, 0, false, 0, false, false, false, 0, 0];

        if (!Array.isArray(accountSubscriptions)) accountSubscriptions = [accountSubscriptions];

        accountSubscriptions.map(accountSubscription => {
          if (accountSubscription.status === 'active' || accountSubscription.status === 'renewal_due') {
            for (let i in subscriptionNames) {
              let subscription = subscriptionNames[i];
              let feature = accountSubscription.features.find(feature => feature.technicalName === subscriptionNames[i]);
              let addons = accountSubscription.addons.find(addon => addon.feature && addon.feature.technicalName === subscriptionNames[i] && (addon.status === 'active' || addon.status === 'renewal_due'));

              if (subscriptionsMap[subscription]) {
                limits[i] = limits[i] || subscriptionsMap[subscription](feature, addons);
                continue;
              }

              if (feature && !addons) {
                limits[i] += +feature.featureValue;

              } else if (addons && !feature) {
                limits[i] += +addons.value;

              } else if (addons && feature) {
                limits[i] += +feature.featureValue + +addons.value;

              } else {
                return Promise.reject(`Cannot retrieve allowed ${ subscriptionNames[i] } amount limits for requested account`);
              }
            }
          }
        });

        return limits;

      });

  };
};

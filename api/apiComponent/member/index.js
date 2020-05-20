'use strict';

module.exports = (components) => {
  return {
    auth: require('./auth')(components),
    account: require('./account')(components),
    reseller: require('./reseller')(components),
    platform: require('./platform')(components),
    onboarding: require('./onboarding')(components),
    subscriptions: require('./subscriptions')(components),
  }
};

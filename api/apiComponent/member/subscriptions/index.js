'use strict';

module.exports = (components) => {
  return {
    getSubscriptions: require('./getSubscriptions')(components),
    getSubscriptionsById: require('./getSubscriptionsById')(components)
  };
};

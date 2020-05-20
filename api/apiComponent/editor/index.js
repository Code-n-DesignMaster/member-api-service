'use strict';

module.exports = (components) => {
  return {
    mail: require('./mail')(components),
    ecommerce: require('./ecommerce')(components)
  };
};

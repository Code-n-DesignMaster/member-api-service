'use strict';

module.exports = (components) => {
  return {
    storage: require('./storage')(components)
  };
};

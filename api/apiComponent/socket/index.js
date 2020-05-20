'use strict';

module.exports = (components) => {
  return {
    auth: require('./auth')(components),
    events: require('./events')(components)
  }
};

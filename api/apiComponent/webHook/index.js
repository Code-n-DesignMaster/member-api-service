'use strict';

module.exports.sendEvent = require('./sendEvent');

module.exports = (components) => {
  return {
    sendEvent: require('./sendEvent')(components),
  }
};

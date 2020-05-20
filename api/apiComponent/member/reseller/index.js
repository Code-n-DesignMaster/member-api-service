'use strict';

module.exports = (components) => {
  return {
    getResellerSettings: require('./getResellerSettings')(components),
    getResellerTemplateSetting: require('./getResellerTemplateSetting')(components),
  }
};

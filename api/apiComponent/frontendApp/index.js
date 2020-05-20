'use strict';

module.exports = (components) => {
  return {
    styles: require('./styles')(components)
  };
};

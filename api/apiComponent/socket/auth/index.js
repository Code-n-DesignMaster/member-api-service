'use strict';

module.exports = (components) => {
  return {
    destroy: require('./destroy')(components)
  };
};

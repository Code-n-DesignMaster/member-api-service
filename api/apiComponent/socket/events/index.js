'use strict';

module.exports = (components) => {
  return {
    broadcast: require('./broadcast')(components)
  };
}

'use strict';

module.exports = (components) => {
  return {
    optimize: require('./optimize')(components),
    resize: require('./resize')(components)
  };
};

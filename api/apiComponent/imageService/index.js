'use strict';

module.exports = (components) => {
  return {
    projects: require('./projects')(components),
    transform: require('./transform')(components),
    resellersLogos: require('./resellersLogos')(components)
  };
};

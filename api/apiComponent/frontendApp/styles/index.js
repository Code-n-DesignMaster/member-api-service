'use strict';

//Moved to subdomain-app

module.exports = (components) => {
  return {
    invalidate: require('./invalidate')(components),
    renderCss: require('./render')(components)
  };
};

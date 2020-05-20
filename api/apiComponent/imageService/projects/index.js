'use strict';

module.exports = (components) => {
  return {
    getFavicons: require('./getFavicons')(components),
    copyIcons: require('./copyIcons')(components),
    mergeIcons: require('./mergeIcons')(components),
    partnerCopyIcons: require('./partnerCopyIcons')(components),
    getPublishedFavicons: require('./getPublishedFavicons')(components),
  };
};

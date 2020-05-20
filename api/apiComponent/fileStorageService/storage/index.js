'use strict';

module.exports = (components) => {
  return {
    info: require('./info')(components),
    deleteHiddenFiles: require('./deleteHiddenFiles')(components),
    remainingStorageSpace: require('./remainingStorageSpace')(components),
    serveThumbnail: require('./serveThumbnail')(components),
    copyProjectFiles: require('./copyProjectFiles')(components)
  };
};

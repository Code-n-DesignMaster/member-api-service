'use strict';

module.exports = (components) => {
  return {
    publishLists: require('./publishLists')(components),
    sendToService: require('./sendToService')(components),
  };
};

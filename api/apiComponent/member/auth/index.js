'use strict';

module.exports = (components) => {
  return {
    attempt: require('./attempt')(components),
    attemptWithoutPassword: require('./attemptWithoutPassword')(components),
    destroy: require('./destroy')(components),
    sendPutAuthToMemberApi: require('./sendPutAuthToMemberApi')(components),
    authByApiKey: require('./authByApiKey')(components)
  };
};

'use strict';

module.exports = (components) => {
  return {
    auth: require('./auth')(components),
    create: require('./create')(components),
    update: require('./update')(components),
    get: require('./get')(components),
    checkEmail: require('./checkEmail')(components),
    createPayment: require('./createPayment')(components),
  };
}

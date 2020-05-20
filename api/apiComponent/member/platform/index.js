'use strict';

module.exports = (components) => {
  return {
    auth: require('./auth')(components),
    user: require('./user')(components),
    partner: require('./partner')(components),
    getPlan: require('./getPlan')(components),
    getPaymentSettings: require('./getPaymentSettings')(components),
    passwordReset: require('./passwordReset')(components),
    passwordConfirm: require('./passwordConfirm')(components),
    createContact: require('./createContact')(components),
    createDemo: require('./createDemo')(components),
    createCV: require('./createCV')(components),
  };
};

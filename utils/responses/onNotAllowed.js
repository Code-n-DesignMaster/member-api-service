'use strict';

const onError = require('./onError');

module.exports = (message = 'Not Allowed', type = 'not-allowed', responseObject) => {
  return onError({
    statusCode: 405,
    body: {
      type, message
    }
  }, responseObject);
};

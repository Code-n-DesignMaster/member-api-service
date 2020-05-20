'use strict';

const onError = require('./onError');

module.exports = (message = 'Forbidden', responseObject) => {
  return onError({
    statusCode: 403,
    body: {
      type: 'forbidden',
      message
    }
  }, responseObject);
};

'use strict';

const onError = require('./onError');

module.exports = (message = 'Internal Server Error', responseObject) => {
  return onError({
    statusCode: 500,
    body: {
      type: 'system',
      message
    }
  }, responseObject);
};

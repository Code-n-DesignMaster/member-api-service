'use strict';

const onError = require('./onError');

module.exports = (message = 'Not Found', responseObject) => {
  return onError({
    statusCode: 404,
    body: {
      type: 'not-found',
      message
    }
  }, responseObject);
};

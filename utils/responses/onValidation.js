'use strict';

const onError = require('./onError');

module.exports = (messages, responseObject) => {
  return onError({
    statusCode: 400,
    body: {
      type: 'validation',
      messages
    }
  }, responseObject);
};

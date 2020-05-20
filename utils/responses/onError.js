'use strict';

const _ = require('lodash');

module.exports = (error, responseObject) => {
  error = _.pick(error, ['statusCode', 'body', 'status']);
  if (!responseObject) {
    return error;
  }

  responseObject
    .status(error.statusCode || error.status)
    .send(_.pick(error.body, ['type', 'message', 'messages']));
};

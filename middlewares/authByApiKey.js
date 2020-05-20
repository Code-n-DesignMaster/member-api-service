'use strict';

const logger = require('../helpers/logger');
const models = require('@sp/mongoose-models');
const { ValidationError, AuthenticationError } = require('@sp/nodejs-utils').errors;

const ApiKey = models.ApiKey;

module.exports = function (req, res, next) {
  const {apiKey} = req.query;

  if (!apiKey) {
    logger.debug('authByApiKey: apiKey not found in req.query');
    return next(new AuthenticationError());
  }

  ApiKey
    .findOne({_id: apiKey})
    .lean()
    .then(doc => {
      if (!doc) {
        logger.debug('authByApiKey: apiKey not found in DB');
        return next(new AuthenticationError());
      }
      return next();
    })
    .catch(next);
};

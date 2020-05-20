'use strict';

const logger = require('../helpers/logger');
const { ValidationError, AuthenticationError } = require('@sp/nodejs-utils').errors;

const models = require('@sp/mongoose-models');
const AccessToken = models.AccessToken;

module.exports = (req, res, next) => {

  if (!req.accessToken) {
    return next(new ValidationError([
      {
        field: 'accessToken',
        message: 'FIELD_REQUIRED'
      }
    ]));
  }

  return AccessToken
    .findById(req.accessToken)
    .then(result => {

      if (!result) {
        return next(new AuthenticationError());
      }

      req.memberApiAccessToken = result.memberApiAccessToken;
      req.user = result.user;
      req.userId = result.userId;
      req.shardId = result.user.shard.shardId;
      req.account = {
        user: req.user,
        userId: req.userId,
        subscriptions: {},
        limits: {}
      };

      result.updatedAt = Date.now();
      result.save();

      next();

      return null;
    })
    .catch(next);
};

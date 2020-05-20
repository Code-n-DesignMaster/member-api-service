'use strict';

const logger = require('../helpers/logger');
const { ValidationError, AuthenticationError } = require('@sp/nodejs-utils').errors;

const models = require('@sp/mongoose-models');
const AccessToken = models.AccessToken;
const ApiKey = models.ApiKey;

module.exports = (req, res, next) => {
  const {apiKey} = req.query;
  if (req.accessToken) {
    AccessToken
      .findById(req.accessToken)
      .then(result => {
        if (!result) {
          return next(new AuthenticationError());
        }

        req.memberApiAccessToken = result.memberApiAccessToken;
        req.user = result.user;
        req.userId = result.userId;
        req.account = {
          user: req.user,
          userId: req.userId,
          subscriptions: {},
          limits: {}
        };

        result.updatedAt = Date.now();
        result.save(() => {});

        next();

        return null;
      })
      .catch(next);
  } else if (apiKey) {
    ApiKey
      .findOne({_id: apiKey})
      .lean()
      .then(doc => {
        if (!doc) {
          return next(new AuthenticationError());
        }
        return next();
      })
      .catch(next);
  } else {
    return next(new ValidationError([
      {
        field: 'accessToken',
        message: 'FIELD_REQUIRED'
      }
    ]));
  }
};

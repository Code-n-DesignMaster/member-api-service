'use strict';

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

const Validation = require('@sp/nodejs-validation')({});
const AuthController = require('../Auth');

const logger = require('../../helpers/logger');

module.exports = (req, res, next) => {
  const isWeakPassword = Validation.isWeakPassword('password', req.body.password);

  if (isWeakPassword) {
    return responses.onValidation(isWeakPassword, res);
  }

  memberApi.account.create(req.body)
    .then(result => {
      if (req.query.auth) {
        AuthController.attempt(req, res);
        return;
      }

      res.status(result.statusCode).send(result.body);
    })
    .catch(error => {
      logger.error(error);
      next(error);
    });
};

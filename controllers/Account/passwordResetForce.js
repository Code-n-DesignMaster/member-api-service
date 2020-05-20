'use strict';

const logger = require('../../helpers/logger');
const responses = require('../../utils/responses');
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const Validation = require('@sp/nodejs-validation')({});

module.exports = (req, res, next) => {
  const isWeakPassword = Validation.isWeakPassword('newPassword', req.body.newPassword);

  if (isWeakPassword) {
    return responses.onValidation(isWeakPassword, res);
  }

  memberApi.account.passwordResetForce(req.body, req.memberApiAccessToken)
    .then(result => {
      res.status(result.statusCode).send(result.body);
    })
    .catch(error => {
      next(error);
    });
};

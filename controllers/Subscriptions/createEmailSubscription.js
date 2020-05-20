'use strict';

const logger = require('../../helpers/logger');

const models = require('@sp/mongoose-models');
const EmailSubscription = models.EmailSubscription;
const { ValidationError } = require('@sp/nodejs-utils').errors;

module.exports = (req, res, next) => {
  const input = {
    email: req.body.email,
    type: req.params.type
  };
  checkIfEmailSubscriptionExists(input)
    .then(() => {
      input.ipAddress = req.ip;
      return createEmailSubscription(input);
    })
    .then(() => res.send({}))
    .catch(error => {
      next(error);
    });
};

function checkIfEmailSubscriptionExists(data) {
  return new Promise((resolve, reject) => {
    EmailSubscription.findOne(data, (error, result) => {
      if(error) {
        return reject(error);
      }

      if(result) {
        return reject(new ValidationError('SUBSCRIPTION_EMAIL_EXISTS'));
      }

      resolve({});
    });
  });
}

function createEmailSubscription(data) {
  return new Promise((resolve, reject) => {
    EmailSubscription.create(data, (error) => {
      if(error) {
        return reject(error);
      }

      resolve({});
    });
  });
}

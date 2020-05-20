'use strict';

const router = require('express').Router();

const Validation = require('@sp/nodejs-validation');
const validate = Validation({type: 'http', group: 'subscriptions'});

const {authByAccessToken} = require('../../middlewares');

const SubscriptionsController = {
  createEmailSubscription: require('./createEmailSubscription'),
  getSubscriptions: require('./getSubscriptions'),
  getSubscriptionsById: require('./getSubscriptionsById'),
};

router.get(
  '/',
  authByAccessToken,
  SubscriptionsController.getSubscriptions);

router.get(
  '/:planId',
  authByAccessToken,
  validate.request('getSubscriptionsById'),
  SubscriptionsController.getSubscriptionsById);

router.post(
  '/email/:type',
  validate.request('createEmailSubscription'),
  SubscriptionsController.createEmailSubscription);

module.exports = router;

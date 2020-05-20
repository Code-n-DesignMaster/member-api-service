'use strict';

const router = require('express').Router();

const Validation = require('@sp/nodejs-validation');
const validate = Validation({type: 'http', group: 'projects'});

const {
  authByAccessToken,
  populateAccountSubscriptions,
  populateAccountLimits
} = require('../../middlewares');

const PartnerController = {
  publish: require('./publish'),
  unpublish: require('./unpublish'),
  unpublishFromDomain: require('./unpublishFromDomain'),
};

router.put(
  '/:projectId/publish',
  authByAccessToken,
  validate.request('publish'),
  populateAccountSubscriptions,
  populateAccountLimits,
  PartnerController.publish);

router.put(
  '/:projectId/unpublish',
  authByAccessToken,
  populateAccountSubscriptions,
  PartnerController.unpublish);

router.put(
  '/:projectId/unpublish-from-domain',
  authByAccessToken,
  populateAccountSubscriptions,
  PartnerController.unpublishFromDomain
);

module.exports = router;


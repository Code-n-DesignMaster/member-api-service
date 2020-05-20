'use strict';

const router = require('express').Router();

const {authByAccessToken} = require('../../middlewares');

const Onboarding = {
  getOnboardings: require('./getOnboardings'),
  getOnboarding: require('./getOnboarding'),
  getOnboardingStep: require('./getOnboardingStep'),
  saveOnboardingStep: require('./saveOnboardingStep')
};

router.get(
  '/',
  authByAccessToken,
  Onboarding.getOnboardings);

router.get(
  '/:id',
  authByAccessToken,
  Onboarding.getOnboarding);

router.get(
  '/:id/step',
  authByAccessToken,
  Onboarding.getOnboardingStep);

router.post(
  '/:id/step',
  authByAccessToken,
  Onboarding.saveOnboardingStep);

module.exports = router;

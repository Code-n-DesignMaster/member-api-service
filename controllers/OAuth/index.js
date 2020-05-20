'use strict';

const router = require('express').Router();

const {
  authByAccessToken,
  stateToQuery,
  checkOAuthToken
} = require('../../middlewares');

const OAuthController = {
  login: require('./login'),
  callback: require('./callback'),
  flickrCallback: require('./flickrCallback'),
  refresh: require('./refresh'),
  check: require('./check'),
  disconnect: require('./disconnect')
};

router.get(
  '/flickr/callback',
  checkOAuthToken,
  OAuthController.flickrCallback);

router.get(
  '/:vendor/callback',
  stateToQuery,
  authByAccessToken,
  OAuthController.callback);

router.get(
  '/:projectId/:vendor',
  authByAccessToken,
  OAuthController.login);

router.put(
  '/:projectId/:vendor/refresh',
  authByAccessToken,
  OAuthController.refresh);

router.get(
  '/:projectId/:vendor/check',
  authByAccessToken,
  OAuthController.check);

router.put(
  '/:projectId/:vendor/disconnect',
  authByAccessToken,
  OAuthController.disconnect);

module.exports = router;


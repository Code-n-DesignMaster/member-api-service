'use strict';

const router = require('express').Router();
const Validation = require('@sp/nodejs-validation');
const validate = Validation({type: 'http', group: 'auth'});

const {
  authByAccessToken,
  authByAccessTokenOrApiKey
} = require('../../middlewares');

const AuthController = {
  attempt: require('./attempt'),
  destroy: require('./destroy'),
  facebookAuth: require('./facebookAuth'),
  facebookAuthCallback: require('./facebookAuthCallback'),
  facebookAuthLink: require('./facebookAuthLink'),
  facebookAuthCallbackLink: require('./facebookAuthCallbackLink'),
  googleAuth: require('./googleAuth'),
  googleAuthLink: require('./googleAuthLink'),
  googleAuthCallback: require('./googleAuthCallback'),
  googleAuthCallbackLink: require('./googleAuthCallbackLink'),
  unlink: require('./unlink'),
  authorizeByMemberApiAccessToken: require('./authorizeByMemberApiAccessToken'),
  sendPutAuthToMemberApi: require('./sendPutAuthToMemberApi'),
  validateAccessTokenOrApiKey: require('./validateAccessTokenOrApiKey'),
};

const stateToAccessToken = function (req, res, next) {
  const state = JSON.parse(req.query.state || "{}");
  req.accessToken = state.accessToken;

  next();
};

router.get(
  '/',
  authByAccessToken,
  (req, res, next) => {
    res.send({
      user: {
        firstName: req.user.firstName,
        lastName: req.user.lastName
      },
      accessToken: req.accessToken,
      redirectUrl: `https://${ req.user.reseller.domain }/dashboard`
    });
    next();
  },
  AuthController.sendPutAuthToMemberApi);

router.post(
  '/',
  validate.request('attempt'),
  AuthController.attempt);

router.post(
  '/crms',
  validate.request('crms'),
  AuthController.authorizeByMemberApiAccessToken);

router.delete(
  '/',
  authByAccessToken,
  AuthController.destroy);


router.get(
  '/facebook',
  AuthController.facebookAuth);

router.get(
  '/facebook/callback',
  AuthController.facebookAuthCallback);

router.get(
  '/link/facebook',
  authByAccessToken,
  AuthController.facebookAuthLink);

router.get(
  '/link/facebook/callback',
  stateToAccessToken,
  authByAccessToken,
  AuthController.facebookAuthCallbackLink);

router.get(
  '/google',
  AuthController.googleAuth);

router.get(
  '/google/callback',
  AuthController.googleAuthCallback);

router.get(
  '/link/google',
  authByAccessToken,
  AuthController.googleAuthLink);

router.get(
  '/link/google/callback',
  stateToAccessToken,
  authByAccessToken,
  AuthController.googleAuthCallbackLink);


router.delete('/:vendor/:id', authByAccessToken, AuthController.unlink);

router.post(
  '/validate',
  authByAccessTokenOrApiKey,
  AuthController.validateAccessTokenOrApiKey);

module.exports = router;

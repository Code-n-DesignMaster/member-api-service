'use strict';

const router = require('express').Router();
const Validation = require('@sp/nodejs-validation');
const validate = Validation({type: 'http', group: 'account'});

const {
  authByAccessToken
} = require('../../middlewares');

const AccountController = {
  create: require('./create'),
  getAccountInfo: require('./getAccountInfo'),
  getAccountPlan: require('./getAccountPlan'),
  getAccountPlanUpgradeUrl: require('./getAccountPlanUpgradeUrl'),
  getAccountContact: require('./getAccountContact'),
  getAccountNotificationSettings: require('./getAccountNotificationSettings'),
  getAccountSubscriptions: require('./getAccountSubscriptions'),
  getAccountPermission: require('./getAccountPermission'),
  getEmailNotifications: require('./getEmailNotifications'),
  getEmailNotificationsById: require('./getEmailNotificationsById'),
  updateAccountInfo: require('./updateAccountInfo'),
  updateAccountContact: require('./updateAccountContact'),
  updateAccountNotificationSettings: require('./updateAccountNotificationSettings'),
  passwordReset: require('./passwordReset'),
  passwordResetConfirm: require('./passwordResetConfirm'),
  passwordResetForce: require('./passwordResetForce'),
  updateAccountEmailConfirm: require('./updateAccountEmailConfirm'),
  accountEmailVerify: require('./accountEmailVerify'),
  accountEmailVerifyExplicitly: require('./accountEmailVerifyExplicitly'),
  getAccountOverview: require('./getAccountOverview'),
  getAccountEditorCapabilities: require('./getAccountEditorCapabilities'),
};

// CREATION
router.post(
  '/',
  validate.request('create'),
  AccountController.create);

// RETRIEVAL
router.get(
  '/',
  authByAccessToken,
  AccountController.getAccountInfo);

router.get(
  '/permission',
  authByAccessToken,
  AccountController.getAccountPermission);

router.get(
  '/editor-capability',
  authByAccessToken,
  AccountController.getAccountEditorCapabilities);

router.get(
  '/plan',
  authByAccessToken,
  AccountController.getAccountPlan);

router.get(
  '/plan-upgrade-url',
  authByAccessToken,
  AccountController.getAccountPlanUpgradeUrl);

router.get(
  '/contact',
  authByAccessToken,
  AccountController.getAccountContact);

router.get(
  '/overview',
  authByAccessToken,
  AccountController.getAccountOverview);

router.get(
  '/notifications',
  authByAccessToken,
  AccountController.getAccountNotificationSettings);

router.get(
  '/subscriptions',
  authByAccessToken,
  AccountController.getAccountSubscriptions);

// MODIFICATION
router.put(
  '/',
  authByAccessToken,
  validate.request('updateAccountInfo'),
  AccountController.updateAccountInfo);

router.put(
  '/contact',
  authByAccessToken,
  AccountController.updateAccountContact);

router.put(
  '/notifications',
  authByAccessToken,
  AccountController.updateAccountNotificationSettings);

router.put(
  '/email/confirm',
  validate.request('emailConfirm'),
  AccountController.updateAccountEmailConfirm);

router.put(
  '/email/verify',
  validate.request('emailVerify'),
  AccountController.accountEmailVerify);

router.get(
  '/email-notifications',
  authByAccessToken,
  AccountController.getEmailNotifications);

router.get(
  '/email-notifications/:emailId',
  validate.request('getEmail'),
  authByAccessToken,
  AccountController.getEmailNotificationsById);

router.post(
  '/email/verify',
  authByAccessToken,
  AccountController.accountEmailVerifyExplicitly);

// PASSWORD RESET
router.post(
  '/password-reset',
  validate.request('passwordReset'),
  AccountController.passwordReset);

router.put(
  '/password-reset',
  validate.request('passwordResetConfirm'),
  AccountController.passwordResetConfirm);

router.put(
  '/password-reset/force',
  authByAccessToken,
  validate.request('passwordResetForce'),
  AccountController.passwordResetForce);

module.exports = router;



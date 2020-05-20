'use strict';

const router = require('express').Router();
const userAgent = require('express-useragent');

const PlatformCtrl = {
  auth: require('./auth'),
  getPlan: require('./getPlan'),
  getPaymentSettings: require('./getPaymentSettings'),
  passwordReset: require('./passwordReset'),
  passwordConfirm: require('./passwordConfirm'),
  contact: require('./contact'),

  authUser: require('./user/auth'),
  createUser: require('./user/create'),
  updateUser: require('./user/update'),
  getUser: require('./user/get'),
  userCheckEmail: require('./user/checkEmail'),
  createUserPayment: require('./user/createPayment'),

  authPartner: require('./partner/auth'),
  createPartner: require('./partner/create'),
  updatePartner: require('./partner/update'),
  getPartner: require('./partner/get'),
  partnerCheckEmail: require('./partner/checkEmail'),
  createPartnerPayment: require('./partner/createPayment')
};

router.get('/plan', PlatformCtrl.getPlan);
router.get('/payment-settings', PlatformCtrl.getPaymentSettings);
router.put('/password-reset', PlatformCtrl.passwordConfirm);
router.post('/password-reset', PlatformCtrl.passwordReset);
router.post('/auth', userAgent.express(), PlatformCtrl.auth);
router.post('/contact', PlatformCtrl.contact);
router.post('/demo', require('./demo'));
router.post('/cv', require('./CV'));


router.get('/user/:userId', PlatformCtrl.getUser);
router.put('/user/:userId', PlatformCtrl.updateUser);
router.post('/user', PlatformCtrl.createUser);
router.post('/user/auth', userAgent.express(), PlatformCtrl.authUser);
router.post('/user/:userId/payment', PlatformCtrl.createUserPayment);
router.post('/user/email-check', PlatformCtrl.userCheckEmail);


router.get('/partner/:partnerId', PlatformCtrl.getPartner);
router.put('/partner/:partnerId', PlatformCtrl.updatePartner);
router.post('/partner/auth', PlatformCtrl.authPartner);
router.post('/partner', PlatformCtrl.createPartner);
router.post('/partner/:partnerId/payment', PlatformCtrl.createPartnerPayment);
router.post('/partner/email-check', PlatformCtrl.partnerCheckEmail);

module.exports = router;


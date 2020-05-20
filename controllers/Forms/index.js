'use strict';

const router = require('express').Router();

const Validation = require('@sp/nodejs-validation');
const validate = Validation({type: 'http', group: 'forms'});

const {authByAccessToken} = require('../../middlewares');

const FormsController = {
  send: require('./send')
};

router.post(
  '/:projectId',
  validate.request('send'),
  FormsController.send);

module.exports = router;

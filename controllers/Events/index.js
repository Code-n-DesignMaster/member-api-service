'use strict';

const router = require('express').Router();

const Validation = require('@sp/nodejs-validation');
const validate = Validation({type: 'http', group: 'phpWebHooks'});

const {authByApiKey} = require('../../middlewares');

const EventController = {
  eventManager: require('./eventManager')
};

router.post(
  '/',
  authByApiKey,
  EventController.eventManager);

module.exports = router;

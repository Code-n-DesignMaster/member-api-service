'use strict';

const router = require('express').Router();
const {
  authByAccessToken,
} = require('../../middlewares');


router.get('/', authByAccessToken, require('./list'));
router.get('/styles', authByAccessToken, require('./styles'));

module.exports = router;

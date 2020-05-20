'use strict';

const router = require('express').Router();

const {authByAccessTokenOrApiKey} = require('../../middlewares');

router.get('/', authByAccessTokenOrApiKey, require('./list'));

module.exports = router;

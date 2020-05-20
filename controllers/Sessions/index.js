'use strict';

const router = require('express').Router();

const {authByAccessToken} = require('../../middlewares');

const Sessions = {
  list: require('./list'),
  remove: require('./delete')
};

router.get(
  '/',
  authByAccessToken,
  Sessions.list
);

router.delete(
  '/:_id',
  authByAccessToken,
  Sessions.remove
);

module.exports = router;

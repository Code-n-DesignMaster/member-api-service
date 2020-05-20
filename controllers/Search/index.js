'use strict';

const router = require('express').Router();

const SearchController = {
  geo: require('./geo')
};

const {authByAccessTokenOrApiKey} = require('../../middlewares');

router.use((req, res, next) => res.status(423).send()); // Close router

router.get(
  '/geo',
  authByAccessTokenOrApiKey,
  SearchController.geo);

module.exports = router;

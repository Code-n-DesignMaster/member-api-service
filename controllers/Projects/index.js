'use strict';

const router = require('express').Router();

const Validation = require('@sp/nodejs-validation');
const validate = Validation({type: 'http', group: 'projects'});

const {
  authByAccessToken,
  authByAccessTokenOrApiKey,
  authByApiKey,
  checkProjectAccessibility,
  populateAccountForDify,
  populateAccountLimits,
  populateAccountSubscriptions,
  populateAccountSubscriptionsFromDb,
} = require('../../middlewares');

const ProjectsController = {
  create: require('./create'),
  list: require('./list'),
  get: require('./get'),
  update: require('./update'),
  publish: require('./publish'),
  unpublish: require('./unpublish'),
  delete: require('./delete'),
  undelete: require('./undelete'),
  getBuild: require('./getBuild'),
  getMenu: require('./getMenu'),
  getPages: require('./getPages'),
  clone: require('./clone'),
  getPublished: require('./getPublished'),
  createPublished: require('./createPublished'),
  updateAdapter: require('./updateAdapter'),
  updateEcommerce: require('./updateEcommerce'),
  clearEcommerceFromPublished: require('./clearEcommerceFromPublished'),
};

router.post(
  '/',
  authByAccessToken,
  validate.request('create'),
  populateAccountSubscriptions,
  populateAccountLimits,
  ProjectsController.create);

router.get(
  '/',
  authByAccessToken,
  validate.request('list'),
  populateAccountSubscriptions,
  populateAccountLimits,
  ProjectsController.list);

router.get(
  '/:projectId',
  authByAccessToken,
  validate.request('get'),
  populateAccountSubscriptions,
  populateAccountLimits,
  ProjectsController.get);

router.put(
  '/:projectId',
  authByAccessToken,
  validate.request('update'),
  ProjectsController.update);

router.put(
  '/:projectId/delete',
  authByAccessToken,
  populateAccountSubscriptions,
  validate.request('delete'),
  ProjectsController.delete);

router.put(
  '/:projectId/undelete',
  authByAccessToken,
  validate.request('undelete'),
  ProjectsController.undelete);

router.post(
  '/:projectId/clone',
  authByAccessToken,
  validate.request('clone'),
  ProjectsController.clone);

router.put(
  '/:projectId/publish',
  authByAccessToken,
  validate.request('publish'),
  populateAccountSubscriptions,
  populateAccountLimits,
  ProjectsController.publish);

router.put(
  '/:projectId/unpublish',
  authByAccessToken,
  validate.request('unpublish'),
  populateAccountSubscriptions,
  ProjectsController.unpublish);

router.put(
  '/:projectId/published',
  authByAccessToken,
  validate.request('createPublished'),
  ProjectsController.createPublished);

router.put(
  '/:projectId/update',
  authByAccessToken,
  populateAccountSubscriptions,
  populateAccountLimits,
  ProjectsController.updateAdapter);

router.get(
  '/:projectId/published',
  authByAccessToken,
  validate.request('getPublished'),
  ProjectsController.getPublished);

router.get(
  '/:projectId/build',
  authByAccessToken,
  populateAccountSubscriptions,
  populateAccountLimits,
  validate.request('getBuild'),
  ProjectsController.getBuild);

router.get(
  '/:projectId/build/menu',
  authByAccessToken,
  ProjectsController.getMenu);

router.get(
  '/:projectId/build/pages',
  authByAccessToken,
  ProjectsController.getPages);

router.get(
  '/:projectId/build-api',
  authByAccessTokenOrApiKey,
  populateAccountSubscriptionsFromDb,
  validate.request('getBuild'),
  ProjectsController.getBuild);

router.post(
  '/create-dify',
  authByApiKey,
  validate.request('create'),
  populateAccountForDify,
  ProjectsController.create);

router.post(
  '/:projectId/publish-dify',
  authByApiKey,
  populateAccountForDify,
  ProjectsController.updateAdapter);

router.put(
  '/ecommerce/:projectId',
  authByAccessTokenOrApiKey,
  ProjectsController.updateEcommerce);

router.delete(
  '/ecommerce-publish/:projectId',
  authByAccessTokenOrApiKey,
  ProjectsController.clearEcommerceFromPublished);

module.exports = router;

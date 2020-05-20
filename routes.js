'use strict';

const router = require('express').Router();
const userAgent = require('express-useragent');

router.use('/auth', userAgent.express(), require('./controllers/Auth'));
router.use('/oauth', require('./controllers/OAuth'));
router.use('/account', require('./controllers/Account'));
router.use('/search', require('./controllers/Search'));
router.use('/projects', require('./controllers/Projects'));
router.use('/templates', require('./controllers/Templates'));
router.use('/template-categories', require('./controllers/TemplateCategories'));
router.use('/subscriptions', require('./controllers/Subscriptions'));
router.use('/sessions', require('./controllers/Sessions'));
router.use('/forms', require('./controllers/Forms'));
router.use('/onboarding', require('./controllers/Onboarding'));
router.use('/events', require('./controllers/Events'));
router.use('/partner', require('./controllers/Partner'));
router.use('/platform', require('./controllers/Platform'));

module.exports = router;

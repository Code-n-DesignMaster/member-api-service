'use strict';

const router = require('express').Router();
const userAgent = require('express-useragent');

router.use('/templates', require('./controllers.v2/Templates'));
router.use('/proxy', require('./controllers.v2/Proxy'));

module.exports = router;

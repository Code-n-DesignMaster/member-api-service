'use strict';

const router = require('express').Router();
const { authByAccessToken } = require('../../middlewares');
const { getUpsellPopup, postUpsellPopup } = require('./upsellPopup');

router.get('/upsell-popup/:upsellPopupId', authByAccessToken, getUpsellPopup);

router.post('/upsell-popup/:upsellPopupId/shown', authByAccessToken, postUpsellPopup);

module.exports = router;

const config = require('../../config');
const request = require('request');

const memberApiServiceUrl = config.apiUrls.member;

async function getUpsellPopup(req, res, next) {
  try {
    const { upsellPopupId } = req.params;

    const options = {
      uri: `${memberApiServiceUrl}/upsell-popup/${upsellPopupId}`,
      headers: {
        Authorization: `Bearer ${req.memberApiAccessToken}`
      }
    };

    request(options).pipe(res);
  } catch (e) {
    return next(e);
  }
}

async function postUpsellPopup(req, res, next) {
  try {
    const { upsellPopupId } = req.params;

    const options = {
      method: 'POST',
      uri: `${memberApiServiceUrl}/upsell-popup/${upsellPopupId}/shown`,
      headers: {
        Authorization: `Bearer ${req.memberApiAccessToken}`
      }
    };

    request(options).pipe(res);
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  getUpsellPopup,
  postUpsellPopup
};

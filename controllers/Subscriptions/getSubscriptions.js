'use strict';

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const responses = require('../../utils/responses');

module.exports = (req, res, next) => {
  getSubscriptions(req.memberApiAccessToken)
    .then(result => res.send(result.body))
    .catch(error => next(error));
};

function getSubscriptions(memberApiAccessToken) {
  return memberApi.subscriptions.getSubscriptions(memberApiAccessToken);
}

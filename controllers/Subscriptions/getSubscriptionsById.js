'use strict';

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

module.exports = (req, res, next) => {
  const planId = req.params.planId;

  getSubscriptionsById(planId, req.memberApiAccessToken)
    .then(result => res.send(result.body))
    .catch(error => next(error));
};

function getSubscriptionsById(planId, memberApiAccessToken) {
  return memberApi.subscriptions.getSubscriptionsById(planId, memberApiAccessToken);
}

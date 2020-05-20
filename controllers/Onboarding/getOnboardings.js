'use strict';

const _ = require('lodash');

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

module.exports = (req, res, next) => {
  memberApi.onboarding.getOnboardings(req.memberApiAccessToken)
    .then(result => {
      res.send(result.body);
    })
    .catch(error => {
      next(error);
    });
};

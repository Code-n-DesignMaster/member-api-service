'use strict';

const _ = require('lodash');
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

module.exports = (req, res, next) => {
  memberApi.account.accountEmailVerifyExplicitly(req.body, req.memberApiAccessToken)
    .then(result => {
      res.status(_.get(result, 'statusCode')).send(result);
    })
    .catch(error => {
      next(error);
    });
};

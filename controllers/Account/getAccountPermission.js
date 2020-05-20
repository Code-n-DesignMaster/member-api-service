'use strict';

const _ = require('lodash');
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

module.exports = (req, res, next) => {
  memberApi.account.getAccountPermission(req.memberApiAccessToken)
    .then(result => {
      res.status(result.statusCode).send(result.body);
    })
    .catch(error => {
      next(error);
    });
};

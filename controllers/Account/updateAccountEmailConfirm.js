'use strict';

const _ = require('lodash');
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

module.exports = (req, res, next) => {
  memberApi.account.updateAccountEmailConfirm(req.body)
    .then(result => {
      res.send(result);
    })
    .catch(error => {
      next(error);
    });
};

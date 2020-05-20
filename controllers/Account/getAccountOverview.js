'use strict';

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

module.exports = (req, res, next) => {
  memberApi.account.getAccountOverview(req.memberApiAccessToken)
    .then(result => {
      res.status(result.statusCode).send(result.body);
    })
    .catch(error => next(error));
};

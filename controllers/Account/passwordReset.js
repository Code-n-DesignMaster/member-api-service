'use strict';

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

module.exports = (req, res, next) => {
  memberApi.account.passwordReset(req.body)
    .then(result => {
      res.status(result.statusCode).send(result.body);
    })
    .catch(error => {
      if (error.statusCode.toString().charAt(0) === '4') {
        return res.status(200).send({});
      }
      next(error);
    });
};

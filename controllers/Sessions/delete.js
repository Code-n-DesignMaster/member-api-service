'use strict';

const logger = require('../../helpers/logger');
const { NotAllowed } = require('@sp/nodejs-utils').errors;

const models = require('@sp/mongoose-models');
const AccessToken = models.AccessToken;

module.exports = (req, res, next) => {
  const _id = req.params._id;

  if (req.accessToken === _id) {
    return next(new NotAllowed());
  }

  AccessToken
    .remove({
      _id: req.params._id,
      userId: req.userId
    })
    .then(data => res.end())
    .catch(next);
};

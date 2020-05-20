'use strict';

const logger = require('../helpers/logger');
const { AuthenticationError } = require('@sp/nodejs-utils').errors;

const models = require('@sp/mongoose-models');
const OAuthToken = models.OAuthToken;

module.exports = (req, res, next) => {
  OAuthToken.findOne({
    accessToken: req.query.oauth_token,
    vendor: 'flickr'
  })
    .select('projectId tokenSecret')
    .lean()
    .then(doc => {
      if (!doc) {
        return next(new AuthenticationError());
      }

      req.query.tokenSecret = doc.tokenSecret;
      req.query.projectId = doc.projectId;
      next()
    })
    .catch(next)
};

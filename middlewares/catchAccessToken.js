'use strict';

const _ = require('lodash');

module.exports = (req, res, next) => {
  if(req.headers.authorization) {
    if(req.headers.authorization.split(' ')[0] === 'Bearer') {
      req.accessToken = _.last(req.headers.authorization.split(' '));
      return next();
    }
  }

  req.accessToken = _.find([
    req.query.accessToken,
    req.body.accessToken,
    req.cookies.accessToken,
  ], token => !_.isEmpty(token));
  req.accessToken = _.trim(req.accessToken);

  if(_.isEmpty(req.accessToken)) {
    delete req.accessToken;
  }

  if(req.accessToken && req.accessToken.split(' ').length > 1) {
    req.accessToken = _.last(req.accessToken.split(' '));
  }

  next();
};

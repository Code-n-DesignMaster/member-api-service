'use strict';

module.exports = function (req, res, next) {
  req.accessToken = JSON.parse(req.query.state).token;
  next();
};

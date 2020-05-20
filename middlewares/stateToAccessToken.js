'use strict';

module.exports = function (req, res, next) {
  req.accessToken = req.query.state;
  next();
};

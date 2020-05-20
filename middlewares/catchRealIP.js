'use strict';

module.exports = (req, res, next) => {
  req.realIP = (req.headers["X-Forwarded-For"] || req.headers["x-forwarded-for"] || '').split(',')[0] || req.client.remoteAddress;
  next();
};

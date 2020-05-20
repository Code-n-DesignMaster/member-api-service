'use strict';

module.exports = (req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  next();
};

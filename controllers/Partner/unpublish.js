'use strict';

const projectUnpublish = require('../Projects/unpublish');

module.exports = (req, res, next) => {
  req.params.partnerUnpublish = true;
  projectUnpublish(req, res, next);
};

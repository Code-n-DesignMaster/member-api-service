'use strict';

const { Categories } = require('@sp/mongoose-models');

module.exports = (req, res, next) => {
  Categories
    .find({})
    .select('_id position name')
    .sort({ position: 1 })
    .lean()
    .then(result => res.send(result))
    .catch(error => next(error));
};

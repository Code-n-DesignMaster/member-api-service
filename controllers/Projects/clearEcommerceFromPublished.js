'use strict';

const logger = require('../../helpers/logger');

const models = require('@sp/mongoose-models');
const PublishedProject = models.PublishedProject;

module.exports = (req, res, next) => {
  PublishedProject
    .update(
      { projectId: req.params.projectId },
      { $unset: { eCommerce: '' } }
    )
    .then(result => {
      res.send({});
    })
    .catch(next);
};

'use strict';

const models = require('@sp/mongoose-models');
const ProjectTemplate = models.ProjectTemplate;

const { NotFound } = require('@sp/nodejs-utils').errors;

module.exports = (req, res, next) => {
  const projectId = req.params.projectId;

  return ProjectTemplate
    .findOne({ projectId })
    .populate('menu', 'list unlinked outOfPlan hidden -_id')
    .select('menu')
    .lean()
    .then((project) => {
      if(!project) return next(new NotFound('PROJECT_NOT_FOUND'));
      res.send(project.menu);
    })
    .catch(err => next(err));
};

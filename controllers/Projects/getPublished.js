'use strict';

const { NotFound } = require('@sp/nodejs-utils').errors;
const { Publish } = require('./services');

module.exports = (req, res, next) => {
  const publish = new Publish({
    projectId: req.params.projectId,
    userId: req.userId
  });

  publish.info()
    .then(project => {
      if (!project) return Promise.reject(new NotFound('PROJECT_NOT_FOUND'));
      const pages = {};
      for (const page of project.pages) {
        pages[page._id] = page.sections;
      }
      project.pages = pages;
      res.send(project);
    })
    .catch(error => next(error));
};

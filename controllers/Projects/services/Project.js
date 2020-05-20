'use strict';

const logger = require('../../../helpers/logger');
const responses = require('../../../utils/responses');

const models = require('@sp/mongoose-models');
const Project = models.Project;
const ProjectTemplate = models.ProjectTemplate;
const ProjectSettings = models.ProjectSettings;
const ProjectEcommerce = models.ProjectEcommerce;
const ProjectTemplatePage = models.ProjectTemplatePage;

module.exports = class {

  constructor({ projectId, userId, deleted }) {
    this.projectId = projectId;
    this.userId = userId;
    this.deleted = deleted;
  }

  /**
   * Get project info
   * @param  {String} projection
   * @return {Promise}
   */
  info(projection) {

    return Project
      .findOne({ _id: this.projectId })
      .select(projection)
      .lean()
      .catch(error => {
        logger.error(error);
        return Promise.reject(responses.onSystemError('Cannot get user project'));
      });
  }

  /**
   * Get project's template
   * @param  {String} projection
   * @param  {Array}  populates
   * @return {Promise}
   */
  template(projection, populates = []) {
    const template = ProjectTemplate
      .findOne({ projectId: this.projectId });

    for (const key in populates) {
      template.populate(key, populates[key]);
    }

    return template
      .select(projection)
      .lean()
      .catch(error => {
        logger.error(error);
        return Promise.reject(responses.onSystemError('Cannot get user project template'));
      });
  }

  /**
   * Get project's pages
   * @param  {String} projection
   * @param  {Array}  populates
   * @return {Promise}
   */
  pages(projection, populates = []) {

    const pages = ProjectTemplatePage
      .find({ projectId: this.projectId });

    for (const key in populates) {
      pages.populate(key, populates[key]);
    }

    return pages
      .select(projection)
      .lean()
      .then(pages => {
        return pages.map(page => {
          page.sections = page.sections.map(e => e.section);
          return page;
        });
      })
      .catch(error => {
        logger.error(error);
        return Promise.reject(responses.onSystemError('Cannot get project pages'));
      });
  }

  /**
   * Get project settings
   * @param  {String} projection
   * @return {Promise}
   */
  settings(projection) {

    return ProjectSettings
      .findOne({ project: this.projectId })
      .select(projection)
      .lean()
      .catch(error => {
        logger.error(error);
        return Promise.reject(responses.onSystemError('Cannot get project settings'));
      });
  }

  ecommerce(projection) {
    return ProjectEcommerce
      .findOne({ projectId: this.projectId })
      .lean()
      .catch(error => {
        logger.error(error);
        return Promise.reject(responses.onSystemError('Cannot get project settings'));
      });
  }

};

const apiComponent = require('../api/apiComponent');
const imageService = apiComponent.getApi('imageService');
const logger = require('./logger');

const debug = require('debug')('app:helper:copyIcons');

/**
 * Copy svg icons set from one project to other project
 * @param projectIdFrom Project id of source of copy
 * @param projectIdTo Project id of destination of copy
 * @param params
 * @param [params.accessToken]
 * @param [params.apiKey]
 */
module.exports = (projectIdFrom, projectIdTo, params) => {
  debug(`projectIdFrom: ${projectIdFrom}`, `projectIdTo: ${projectIdTo}`, `params: `, params);
  let promise;

  if (params.accessToken) {
    promise = imageService.projects.copyIcons(projectIdFrom, projectIdTo, params.accessToken);
  } else if (params.apiKey) {
    promise = imageService.projects.partnerCopyIcons(projectIdFrom, projectIdTo, params.apiKey);
  }

  promise.catch(err => {
    if (err) {
      if (err.statusCode !== 404) {
        logger.error(err)
      }
    }
  });
};

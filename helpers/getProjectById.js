"use strict";

const logger = require('./logger');

const models = require('@sp/mongoose-models');
const Project = models.Project;
const PublishedProject = models.PublishedProject;

module.exports = (projectId) => {
  let callStack = [];

  callStack.push(
    new Promise((resolve, reject) => {
      Project
        .findOne({_id: projectId})
        .populate('domains', '_id name type useWWW isPrimary isVerified newName')
        .populate('template', 'title description src -_id')
        .populate('projectTemplate', '-_id title description menu styles header footer')
        .lean()
        .exec((error, result) => {
          if (error) {
            logger.error(error, {message: 'Error of getting project.', projectId});
            return reject({
              statusCode: 400,
              body: {
                type: 'system',
                message: 'Cannot get user project. ProjectId: ' + projectId
              }
            });
          }

          if (!result) {
            logger.error({message: 'User project not found.', projectId});
            return reject({
              statusCode: 400,
              body: {
                type: 'system',
                message: 'User project not found. ProjectId: ' + projectId
              }
            });
          }

          resolve(result);
        });
    })
  );

  callStack.push(
    new Promise((resolve, reject) => {
      PublishedProject
        .findOne({projectId})
        .exec((error, result) => {
          if (error) {
            logger.error(error);
            return reject({
              statusCode: 500,
              body: {
                type: 'system',
                message: 'Cannot get user project'
              }
            });
          }

          if(result === null){
            result = {};
          }

          resolve(result);
        });
    })
  );
  return Promise.all(callStack)
    .then(results => {
      results[0].publishedProject = results[1];
      return results[0];
    });
};

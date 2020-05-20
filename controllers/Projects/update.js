'use strict';

const _ = require('lodash');

const logger = require('../../helpers/logger');
const { NotFound } = require('@sp/nodejs-utils').errors;

const apiComponent = require('../../api/apiComponent');
const webHookApi = apiComponent.getApi('webHook');

const models = require('@sp/mongoose-models');
const Project = models.Project;
const ProjectDomain = models.ProjectDomain;

module.exports = (req, res, next) => {
  const userId = req.userId;
  const resellerDomain = req.user.reseller.domain;
  const fields = ['name'];
  const update = _.pick(req.body, fields);
  const query = {
    _id: req.params.projectId,
    userId: req.userId,
    deleted: false
  };

  Project.findOne(
    query,
    (error, project) => {
      if(error) {
        return next(error);
      }

      if(!project) {
        return next(new NotFound('PROJECT_NOT_FOUND'));
      }

      // send event to webHook api ------------
      try {
        ProjectDomain
          .findOne({project: project._id, type: 'free'})
          .then(doc => {
            const eventData = {
              type: 'project:updated',
              payload: {
                memberId: userId,
                projectId: project._id,
                name: update.name,
                domain: `${doc && doc.name || ''}.${resellerDomain}`
              }
            };
            webHookApi.sendEvent(eventData).then(response => {})
          });

      } catch(err) {
        console.log('WebHookApi Error:', err);
        logger.error(err);
      }

      getProjectNextNum({userId: req.userId, name: update.name, _id: {$ne : project._id}})
        .then(num => {
          Project.updateOne(query, {
            $set: {
              name: update.name,
              updateAt: project.updatedAt,
              num
            }
          }).exec();
          res.send({num});
        }
      );
    })
};

function getNum(nums) {
  let num = nums.length ? nums[nums.length - 1] + 1 : 1;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] != i + 1) {
      num = i + 1;
      break;
    }
  }
  return num;
}

function getProjectNextNum(query) {
  return new Promise((resolve) => {
    Project
      .find(query)
      .sort('num')
      .select('num')
      .lean()
      .exec((error, projects) => {

        if (error) {
          logger.error(error);
          return resolve(1);
        }

        const num = getNum(projects.map(project => project.num));
        resolve(num);
      });
  });
}

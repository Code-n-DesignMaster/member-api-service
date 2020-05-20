const projectUnpublish = require('../shared/projectUnpublish');
const getUserProject = require('../shared/getUserProject');

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const projectUnPublished = memberApi.account.projectUnPublished;

const models = require('@sp/mongoose-models');
const Project = models.Project;
const ProjectDomain = models.ProjectDomain;

const debug = require('debug')('app:controller:Project:unpublish');

module.exports = (req, res, next) => {
  const userId = req.userId;
  const projectId = req.params.projectId;
  const subscription = req.account.subscriptions[0];
  const subscriptionId = subscription.productId;

  debug('userId', userId);
  debug('projectId', projectId);
  debug('subscriptionId', subscriptionId);

  getUserProject(userId, projectId)
    .then((project) => {
      // Project already unpublished
      if (project.published === false) {
        debug('Project already unpublished');
        return res.send({});
      }

      debug('Project unpublish');
      let unpublishFlow = [
        projectUnpublish(userId, projectId, subscriptionId, project)
      ];

      const publishPartnerDomainOnly = getPublishPartnerDomainOnly(subscription);
      if(publishPartnerDomainOnly && publishPartnerDomainOnly === 'true') {
        debug('disconnectPartnerDomain');
        unpublishFlow.push(disconnectPartnerDomain(projectId))
      }

      return Promise.all(unpublishFlow)
        .then(() => {
          projectUnPublished(projectId, null, userId);

          return res.send({});
        })
    })
    .catch(err => {
      console.log(err);
      next(err);
    });
};

function getPublishPartnerDomainOnly(subscription) {
  const feature = subscription.features.find(f => f.technicalName === 'publishPartnerDomainOnly');
  return feature && feature.featureValue;
}

function disconnectPartnerDomain(projectId) {
  return ProjectDomain.findOne({project: projectId, type: 'partner'}).then((domain) => {
    if(!domain) return Promise.resolve({});

    return Promise.all([
      ProjectDomain.update({_id: domain._id}, {
        $unset: {project: 1},
        $set: {isPrimary: false}
      }),
      Project.update({_id: projectId}, { $pull: { domains: domain._id } }),
      ProjectDomain.findOneAndUpdate({ project: projectId, type: 'free' }, {$set: {isPrimary: true}})
    ])
  })
}

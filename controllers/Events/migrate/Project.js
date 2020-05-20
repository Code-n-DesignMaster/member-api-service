'use strict';

const _ = require('lodash');
const unflatten = require('flat').unflatten;

const logger = require('../../../helpers/logger');
const getUserProject = require('../../shared/getUserProject');
const projectUnpublish = require('../../shared/projectUnpublish');

const models = require('@sp/mongoose-models');
const Project = models.Project;
const ProjectMenu = models.ProjectTemplateMenu;
const ProjectEcommerce = models.ProjectEcommerce;
const PublishedProject = models.PublishedProject;
const projectApiService = require('../../../api/ProjectApiService');
const apiComponent = require('../../../api/apiComponent');
const socketService = apiComponent.getApi('socket');
const frontendAppApi = apiComponent.getApi('frontendApp');
const { ProjectEcommerceFormatter } = require('../../../app/formatters');

const getMenuUpdatedByLimit = require('../../../utils/getMenuUpdatedByLimit');

const debug = require('debug')('app:controller:Events:migrate:Project');

module.exports = class {
  constructor(userId, limits) {
    this.userId = userId;
    this.limits = limits;
  }

  /**
   * migrate menu
   * @return {Promise}
   */
  menu() {
    return Project
      .aggregate([
        {$match: {userId: this.userId}},
        {
          $lookup: {
            from: "project_template_menus",
            localField: "_id",
            foreignField: "projectId",
            as: "menu"
          }
        },
        {$match: {'menu.0': {$exists: true}}},
        {$project: {menu: {$arrayElemAt: ['$menu', 0]}}}
      ])
      .then(docs => {
        const promises = docs.map(item => {
          const updatedMenu = getMenuUpdatedByLimit(item.menu, this.limits.maxAllowedPages);
          //If no updates don't touch DB
          if(!updatedMenu) return Promise.resolve({});
          //Else update in DB
          return ProjectMenu.updateOne({projectId: item._id}, {$set: updatedMenu});
        });

        return Promise.all(promises);
      })
  }

  PublishedProjects(subscriptions, user) {
    let callStack = [];
    let status = '';
    subscriptions.map(subscription => {
      if (user.status === subscription.status) {
        status = user.status;
      } else if (user.status === 'pending') {
        status = 'active';
      } else if (user.status !== 'active') {
        status = user.status;
      } else {
        status = subscription.status;
      }

      callStack.push(PublishedProject.updateMany(
        {'subscriptionId': subscription._id},
        {$set: {'mergedStatus': status}}
      ))
    });

    return Promise.all(callStack);
  }

  static unpublishProject(subscription) {
    const userId = subscription.userId;
    const subscriptionId = subscription._id;

    // Get all published project for subscription
    return PublishedProject
      .find({ subscriptionId })
      .select('projectId')
      .lean()
      .then((projects) => {
        if (!projects.length) return Promise.resolve();

        const promises = projects.map(p => {
          return getUserProject(userId, p.projectId)
            .then((project) => projectUnpublish(userId, p.projectId, subscriptionId, project));
        });

        return Promise.all(promises);
      });
  }

  static republish(subscription) {
    return Promise
      .all([
        PublishedProject
          .find({ subscriptionId: subscription.getId() })
          .select('projectId menu')
          .lean(),
        ProjectEcommerce
          .find({ userId: subscription.userId })
          .lean()
      ])
      .then(([projects, projectEcommerces]) => {
        if (!projects.length) return Promise.resolve();
        if (!projectEcommerces.length) return Promise.resolve();

        projects.map(project => {
          const projectEcommerce = projectEcommerces.find(e => e.projectId === project.projectId);
          const eCommerce = projectEcommerce ? (new ProjectEcommerceFormatter(projectEcommerce, project.menu, subscription)).format() : {};

          return PublishedProject
            .updateOne({ projectId: project.projectId }, { eCommerce })
            .then(() => projectApiService.republish(project.projectId, subscription.userId))
        });
      })
  }

  static republishOnSuspend(subscription) {
    const { userId } = subscription;
    const subscriptionId = subscription.getId();

    return PublishedProject.find({ userId: userId }).select('projectId').lean()
      .then((projects) => {
        if (!projects.length) return Promise.resolve();

        const callstack = [];
        projects.map(project => {
          const projectId = project.projectId;
          callstack.push(
            PublishedProject.updateOne({ projectId: projectId }, { subscriptionId, mergedStatus: 'active' })
              .then(() => Project.updateOne({_id: projectId}, {$set: { published: true }}))
              .then(() => frontendAppApi.styles.renderCss(projectId))
              .then(() => projectApiService.republish(projectId, userId))
          )
        });

        return Promise.all(callstack);
      })
  }

  static planChanged(subscription) {
    debug('planChanged', subscription.getId());

    const premiumFeatures = getPremiumFeatures(subscription);

    return PublishedProject
      .find({ subscriptionId: subscription.getId() })
      .select('projectId menu premiumFeatures')
      .lean()
      .then((projects) => {
        if (!projects.length) return Promise.resolve();

        const callstack = [];
        projects.map(project => {
          const updateObj = { premiumFeatures: null };
          if(premiumFeatures && !_.isEmpty(premiumFeatures)) {
            updateObj.premiumFeatures = unflatten(premiumFeatures);
          }

          callstack.push(
            PublishedProject.updateOne({ projectId: project.projectId }, updateObj)
              .then(() => projectApiService.republish(project.projectId, subscription.userId))
          );
        });

        return Promise.all(callstack);
      })
  }

  static subscriptionChanged(subscription, action) {
    const { userId } = subscription;
    const eventData = { action: 'changed' };

    if (action) eventData.action = action;

    return Project.find({ userId, deleted: false })
      .then(projects => {
        return projects.map(p => {
          socketService.events.broadcast(p._id, { event: 'subscription', data: eventData }).catch(logger.error)
        });
      });
  }
};

function getPremiumFeatures(subscription) {
  const features = subscription.features;
  return features.reduce((acc, feature) => {
    if(feature.technicalName.startsWith('premium.')) {
      acc[feature.technicalName] = feature.featureValue;
      return acc;
    }
    return acc;
  }, {})
}

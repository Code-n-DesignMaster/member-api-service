'use strict';

const { ValidationError } = require('@sp/nodejs-utils').errors;
const { SubscriptionMapper } = require('@sp/nodejs-utils/classes/mappers');
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

const {Publish} = require('./services');

const models = require('@sp/mongoose-models');
const PublishedProject = models.PublishedProject;
const Reseller = models.Reseller;

module.exports = (req) => {
  let subscriptions = {};
  let permissions;
  let resellerSettings;

  const resellerId = req.user.resellerId;
  const assetsVersion = req.body.assetsVersion;

  return Promise
    .all([
      memberApi.account.getAccountSubscriptions(req.memberApiAccessToken, req.userId),
      memberApi.account.getAccountPermission(req.memberApiAccessToken, req.userId),
      Reseller.findOne({resellerId: resellerId}).select('settings').lean()
    ])
    .then(([subscriptionsResult, permissionsResult, reseller]) => {
      resellerSettings = reseller.settings;
      permissions = permissionsResult.body;

      const promises = subscriptionsResult.body.map(sub => {
        return memberApi.account.getLimits(["sites", "projects"], null, sub).then(limits => sub.limits = limits);
      });

      return Promise.all(promises).then(() => subscriptionsResult.body);
    })
    .then(result => {
      subscriptions = result;
      return Promise.all(subscriptions.map(subscription => {
        return PublishedProject
          .aggregate([
            {$match: {subscriptionId: subscription.productId}},
            {
              $lookup: {
                from: "projects",
                localField: "projectId",
                foreignField: "_id",
                as: "project"
              }
            },
            {$match: {'project.published': {$eq: true}}},
          ])
      }))
    })
    .then(results => {
      let productId, status, sitesFeature, sitesAddons, maxAllowedSites = 0, publishedProject;

      results.map(result => {
        let currentProject = result.find(project => project.projectId === req.params.projectId);
        if (currentProject) {
          publishedProject = currentProject;
        }
      });

      if (publishedProject !== undefined && (publishedProject.mergedStatus === 'active' || publishedProject.mergedStatus === 'renewal_due')) {
        productId = publishedProject.subscriptionId;
        status = publishedProject.mergedStatus;
      } else {
        for (let i = 0; i < results.length; i++) {
          if (subscriptions[i].status === 'active' || subscriptions[i].status === 'renewal_due') {
            if (results[i].length < subscriptions[i].limits[0]) {
              productId = subscriptions[i].productId;
              status = subscriptions[i].status;
              break;
            }
          }
        }
      }

      if (!(status === 'active' || status === 'renewal_due')) {
        return Promise.reject(new ValidationError('SUBSCRIPTION_LIMIT_EXCEED'))
      }

      const publish = new Publish({
        projectId: req.params.projectId,
        userId: req.userId,
        resellerId: req.user.resellerId,
        showAdvertisement: req.account.showAdvertisement,
        subscriptionId: productId,
        mergedStatus: status,
        assetsVersion,
        permissions,
        resellerSettings,
        subscription: new SubscriptionMapper(subscriptions).one(),
      });

      return publish.create();
    });
};

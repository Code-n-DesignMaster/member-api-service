'use strict';

const _ = require('lodash');

const config = require('../../../config');
const logger = require('../../../helpers/logger');

const { SubscriptionModel } = require('@sp/nodejs-utils/classes/models');
const { EcommercePlanChangedSpecification } = require('@sp/nodejs-utils/classes/specifications');
const {
  PausingEcommerceFeatureSpecification,
  HasEcommerceLockTypeSpecification,
  ResumingEcommerceFeatureSpecification,
  ExpiringPausedEcommerceFeatureSpecification,
  ExpiringActiveEcommerceFeatureSpecification,
} = require('../../../app/classes/specifications');

const apiComponent = require('../../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const ecommerceApiService = require('../../../api/EcommerceApiService');
const ecommerceApiServiceV2 = require('../../../api/EcommerceApiService/v2');

const eventMember = require('./eventMember');
const ProjectMigrate = require('../migrate').Project;

const models = require('@sp/mongoose-models');
const AccountsSubscriptions = models.AccountsSubscriptions;
const AccountsLimits = models.AccountsLimits;
const AccountsInfo = models.AccountsInfo;
const ApiKey = models.ApiKey;

const debug = require('debug')('app:controller:Events:Subscription');

module.exports = class {
  constructor(userId, status, payload) {
    this.userId = userId;
    this.status = status;
    this.payload = payload;
    this.limits = {};
  }

  process() {
    return this.getData()
      .then((results) => {
        const subscriptions = results[0];
        const user = results[1];

        try {
          debug(`User: ${this.userId} subscription ${this.payload.productId} status ${this.status}`);
          debug(`Subscriptions`, subscriptions.map(s => ({_id: s._id, status: s.status})));
          return this[this.status](subscriptions)
            .then(() => {
              this._updateLimits(subscriptions);

              if (user === null) {
                new eventMember(this.userId, '_updateIfNotExist').process()
                  .then(user => {
                    this._migrateData(subscriptions, user);
                  });
              }
              else {
                this._migrateData(subscriptions, user);
              }

              return subscriptions;
            })
        } catch (err) {
          return Promise.reject(err);
        }
      });
  }

  updateDataWhenLogin() {
    return this.getData()
      .then(results => {
        const subscriptions = results[0];
        const user = results[1];

        return Promise.all([
          this._update(subscriptions),
          this._updateLimits(subscriptions),
          new eventMember(this.userId, '_updateIfNotExist').process()
        ]);
      })
      .catch(err => {
        logger.error(err);
      });
  }

  _disconnectEcommerce(subscription) {
    return ApiKey.findOne({})
      .lean()
      .then(apiKey => ecommerceApiService.disconnectStore(this.userId, subscription, apiKey._id))
      .catch(error => {
        if(error.statusCode !== 424) return Promise.reject(error);
      });
  }

  _update(subscriptions) {
    let callStack = [];

    subscriptions.map(subscription => {
      ProjectMigrate.subscriptionChanged(subscription);

      subscription.limits = this.countSubscriptionLimits(subscription);
      AccountsSubscriptions
        .update(
          { _id: subscription._id },
          { $set: subscription },
          { upsert: true },
          (error, result) => {
            if (error) {
              logger.error(error);
              return Promise.reject({
                statusCode: 500,
                body: {
                  type: 'system',
                  message: 'Cannot update user'
                }
              });
            }
          }
        );
    });

    return Promise.resolve(subscriptions);
  }

  countSubscriptionLimits(subscription) {
    let
      maxAllowedProjects = 0,
      projectsFeature = {},
      projectsAddons = [],
      maxAllowedSites = 0,
      sitesFeature = {},
      sitesAddons = {},
      outOfPlanLimit = 0,
      maxAllowedPages = 0,
      maxFileStorageSpace = 0,
      storageFeature = {},
      storageAddons = {},
      showAdvertisement = false,
      sitesFeatureAds = {},
      supportFeature = {},
      support = false,
      freeDomainsFeature = {},
      freeDomains = false,
      connectDomainFeature = {},
      connectDomain = false,
      analyticsFeature = {},
      analytics = 'basic',
      advertisementAddons = {},
      supportAddons = {},
      freeDomainsAddons = {},
      connectDomainAddons = {},
      analyticsAddons = {},
      ecommerceFeature = false,
      ecommerceTemplatesFeature = false,
      productLimitFeature = 0,
      storeProductFeature = false,
      storeCatalogFeature = false,
      ecommerceCartFeature = false,
      shippingFeature = false,
      storeLimitFeature = 0,
      storePlanFeature = '',
      storeProviderFeature;

    const defineFeatureValue = (initialValue, featureName, subscription, type) => {
      let subscriptionFeature;
      subscriptionFeature = subscription.features.find(feature => feature.technicalName === featureName);

      if (subscriptionFeature) {
        switch (type) {
          case 'bool':
            return subscriptionFeature.featureValue === 'true' || subscriptionFeature.featureValue === true;
            break;

          case 'int':
            return parseInt(subscriptionFeature.featureValue);
            break;

          case 'string':
            return subscriptionFeature.featureValue;
            break;

          default:
            logger.error('Wromg type');
            break;
        }

      }

      return initialValue;
    };


    if (subscription.features && !_.isEmpty(subscription.features)) {
      projectsFeature = subscription.features.find(feature => feature.technicalName === 'projects');
      if (projectsFeature) {
        maxAllowedProjects = parseInt(projectsFeature.featureValue);
        outOfPlanLimit = parseInt(projectsFeature.featureValue);
      }

      sitesFeature = subscription.features.find(feature => feature.technicalName === 'sites');
      if (sitesFeature) {
        maxAllowedSites = parseInt(sitesFeature.featureValue);
      }

      sitesFeature = subscription.features.find(feature => feature.technicalName === 'pages');
      if (sitesFeature) {
        maxAllowedPages = parseInt(sitesFeature.featureValue);
      }

      storageFeature = subscription.features.find(feature => feature.technicalName === 'storage');
      if (storageFeature) {
        maxFileStorageSpace = parseInt(storageFeature.featureValue);
      }

      sitesFeatureAds = subscription.features.find(feature => feature.technicalName === 'advertisement');
      if (sitesFeatureAds) {
        showAdvertisement = (sitesFeatureAds.featureValue === 'true' || sitesFeatureAds.featureValue === true);
      }

      supportFeature = subscription.features.find(feature => feature.technicalName === 'support');
      if (supportFeature) {
        support = (supportFeature.featureValue === 'true' || supportFeature.featureValue === true);
      }

      freeDomainsFeature = subscription.features.find(feature => feature.technicalName === 'freeDomains');
      if (freeDomainsFeature) {
        freeDomains = (freeDomainsFeature.featureValue === 'true' || freeDomainsFeature.featureValue === true);
      }

      connectDomainFeature = subscription.features.find(feature => feature.technicalName === 'connectDomain');
      if (connectDomainFeature) {
        connectDomain = (connectDomainFeature.featureValue === 'true' || connectDomainFeature.featureValue === true);
      }

      analyticsFeature = subscription.features.find(feature => feature.technicalName === 'analytics');
      if (analyticsFeature) {
        analytics = analyticsFeature.featureValue;
      }

      ecommerceFeature = defineFeatureValue(ecommerceFeature, 'ecommerce', subscription, 'bool');

      if (ecommerceFeature) {
        storeProductFeature = defineFeatureValue(storeProductFeature, 'storeProduct', subscription, 'bool');
        ecommerceTemplatesFeature = defineFeatureValue(storeProductFeature, 'ecommerceTemplates', subscription, 'bool');
        storeCatalogFeature = defineFeatureValue(storeCatalogFeature, 'storeCatalog', subscription, 'bool');
        ecommerceCartFeature = defineFeatureValue(ecommerceCartFeature, 'ecommerceCart', subscription, 'bool');
        shippingFeature = defineFeatureValue(shippingFeature, 'shipping', subscription, 'bool');

        productLimitFeature = defineFeatureValue(productLimitFeature, 'productLimit', subscription, 'int');
        storeLimitFeature = defineFeatureValue(storeLimitFeature, 'storeLimit', subscription, 'int');
        storePlanFeature = defineFeatureValue(storePlanFeature, 'storePlan', subscription, 'string');
        storeProviderFeature = defineFeatureValue(storeProviderFeature, 'storeProvider', subscription, 'string');
      }
    }

    if (subscription.addons && !_.isEmpty(subscription.addons)) {
      projectsAddons = subscription.addons.filter(addon => addon.feature && addon.feature.technicalName === 'projects' && (addon.status === 'active' || addon.status === 'renewal_due'));
      if (!_.isEmpty(projectsAddons)) {
        for (const projectsAddon of projectsAddons) {
          maxAllowedProjects += parseInt(projectsAddon.value);
          outOfPlanLimit += parseInt(projectsAddon.value);
        }
      }

      sitesAddons = subscription.addons.filter(addon => addon.feature && addon.feature.technicalName === 'sites' && (addon.status === 'active' || addon.status === 'renewal_due'));
      if (!_.isEmpty(sitesAddons)) {
        for (const sitesAddon of sitesAddons) {
          maxAllowedSites += parseInt(sitesAddon.value);
        }
      }

      sitesAddons = subscription.addons.filter(addon => addon.feature && addon.feature.technicalName === 'pages' && (addon.status === 'active' || addon.status === 'renewal_due'));
      if (!_.isEmpty(sitesAddons)) {
        for (const sitesAddon of sitesAddons) {
          maxAllowedPages += parseInt(sitesAddon.value);
        }
      }

      storageAddons = subscription.addons.filter(addon => addon.feature && addon.feature.technicalName === 'storage' && (addon.status === 'active' || addon.status === 'renewal_due'));
      if (!_.isEmpty(storageAddons)) {
        for (const storageAddon of storageAddons) {
          maxFileStorageSpace += parseInt(storageAddon.value);
        }
      }

      advertisementAddons = subscription.addons.filter(addon => addon.feature && addon.feature.technicalName === 'advertisement' && (addon.status === 'active' || addon.status === 'renewal_due'));
      if (!_.isEmpty(advertisementAddons)) {
        for (const advertisementAddon of advertisementAddons) {
          showAdvertisement = showAdvertisement || (advertisementAddon.value === 'true' || advertisementAddon.value === true);
        }
      }

      supportAddons = subscription.addons.filter(addon => addon.feature && addon.feature.technicalName === 'support' && (addon.status === 'active' || addon.status === 'renewal_due'));
      if (!_.isEmpty(supportAddons)) {
        for (const supportAddon of supportAddons) {
          support = support || (supportAddon.value === 'true' || supportAddon.value === true);
        }
      }

      freeDomainsAddons = subscription.addons.filter(addon => addon.feature && addon.feature.technicalName === 'freeDomains' && (addon.status === 'active' || addon.status === 'renewal_due'));
      if (!_.isEmpty(freeDomainsAddons)) {
        for (const freeDomainsAddon of freeDomainsAddons) {
          freeDomains = freeDomains || (freeDomainsAddon.value === 'true' || freeDomainsAddon.value === true);
        }
      }

      connectDomainAddons = subscription.addons.filter(addon => addon.feature && addon.feature.technicalName === 'connectDomain' && (addon.status === 'active' || addon.status === 'renewal_due'));
      if (!_.isEmpty(connectDomainAddons)) {
        for (const connectDomainAddon of connectDomainAddons) {
          connectDomain = connectDomain || (connectDomainAddon.value === 'true' || connectDomainAddon.value === true);
        }
      }

      analyticsAddons = subscription.addons.filter(addon => addon.feature && addon.feature.technicalName === 'analytics' && (addon.status === 'active' || addon.status === 'renewal_due'));
      if (!_.isEmpty(analyticsAddons)) {
        for (const analyticsAddon of analyticsAddons) {
          if (analyticsAddon.value === 'advanced') {
            analytics = analyticsAddon.value;
          }
        }
      }
    }

    let limits = {
      maxAllowedProjects,
      outOfPlanLimit,
      maxAllowedSites,
      maxAllowedPages,
      maxFileStorageSpace,
      showAdvertisement,
      support,
      freeDomains,
      connectDomain,
      analytics
    };

    if (ecommerceFeature) {
      limits.ecommerce = {
        ecommerce: ecommerceFeature,
        ecommerceTemplates: ecommerceTemplatesFeature,
        storeProduct: storeProductFeature,
        storeCatalog: storeCatalogFeature,
        ecommerceCart: ecommerceCartFeature,
        shipping: shippingFeature,
        storeProviders: {
          [storeProviderFeature]: {
            [storePlanFeature]: {
              productLimit: productLimitFeature,
              storeLimit: storeLimitFeature,
            }
          }
        },
      };
    }

    subscription.limits = limits;

    return limits;
  }

  _mergeStoreProviders(current, newOne) {
    let elements = [];

    if (_.isEmpty(current)) {
      Object.assign(current, newOne);
    }
    else {
      elements = _.union(Object.keys(current), Object.keys(newOne));
      elements.map(element => {
        if (!_.isEmpty(current[element])) {
          return this._mergeStoreProviders(current[element], newOne[element]);
        }
        else {
          if (element === 'storeLimit') {
            current[element] += newOne[element];
          }
          else {
            return this._mergeStoreProviders(current[element], newOne[element]);
          }
        }
      });

    }
  }

  /**
   * group limits
   * @param  {Array} subscriptions list of subscriptions
   * @return {Object}               list of limits (projects, sites, storage, ...)
   */
  _groupLimits(subscriptions) {

    this.limits = {
      maxAllowedProjects: 0,
      maxAllowedSites: 0,
      outOfPlanLimit: 0,
      maxFileStorageSpace: 0,
      maxAllowedPages: 0,
      mustShowAdvertisement: false,
      analytics: 'basic',
      freeDomains: false,
      connectDomain: false,
      support: false,
      ecommerce: {
        ecommerce: false,
        ecommerceTemplates: false,
        storeProduct: false,
        storeCatalog: false,
        ecommerceCart: false,
        shipping: false,
        storeProviders: {}
      }
    };

    const defaultMaxAllowedProjects = config.maxAllowedProjects;

    subscriptions.map(subscription => {
      if (subscription.status === 'active' || subscription.status === 'renewal_due') {
        let subscriptionLimit = this.countSubscriptionLimits(subscription);

        if (subscriptionLimit.maxAllowedProjects < defaultMaxAllowedProjects) {
          subscriptionLimit.maxAllowedProjects = defaultMaxAllowedProjects;
        }

        this.limits.maxAllowedProjects += subscriptionLimit.maxAllowedProjects;
        this.limits.maxAllowedSites += subscriptionLimit.maxAllowedSites;
        this.limits.outOfPlanLimit += subscriptionLimit.outOfPlanLimit;
        this.limits.maxAllowedPages += subscriptionLimit.maxAllowedPages;
        this.limits.maxFileStorageSpace += subscriptionLimit.maxFileStorageSpace;
        this.limits.mustShowAdvertisement = this.limits.mustShowAdvertisement || subscriptionLimit.showAdvertisement;
        this.limits.support = this.limits.support || subscriptionLimit.support;
        this.limits.freeDomains = this.limits.freeDomains || subscriptionLimit.freeDomains;
        this.limits.connectDomain = this.limits.connectDomain || subscriptionLimit.connectDomain;
        this.limits.analytics = (subscriptionLimit.analytics === 'advanced') ? subscriptionLimit.analytics : this.limits.analytics;
        this.limits._id = subscription.userId;

        if (subscriptionLimit.ecommerce !== undefined) {
          this.limits.ecommerce.ecommerce = this.limits.ecommerce.ecommerce || subscriptionLimit.ecommerce.ecommerce;
          this.limits.ecommerce.ecommerceTemplates = this.limits.ecommerce.ecommerceTemplates || subscriptionLimit.ecommerce.ecommerceTemplates;
          this.limits.ecommerce.storeProduct = this.limits.ecommerce.storeProduct || subscriptionLimit.ecommerce.storeProduct;
          this.limits.ecommerce.storeCatalog = this.limits.ecommerce.storeCatalog || subscriptionLimit.ecommerce.storeCatalog;
          this.limits.ecommerce.ecommerceCart = this.limits.ecommerce.ecommerceCart || subscriptionLimit.ecommerce.ecommerceCart;
          this.limits.ecommerce.shipping = this.limits.ecommerce.shipping || subscriptionLimit.ecommerce.shipping;

          this._mergeStoreProviders(this.limits.ecommerce.storeProviders, subscriptionLimit.ecommerce.storeProviders);
        }
      }
    });

    if(this.limits.maxAllowedPages === 0) {
      this.limits.maxAllowedPages = 1;
    }

    return this.limits;
  }

  _updateLimits(subscriptions) {

    const limits = this._groupLimits(subscriptions);

    return new Promise((resolve, reject) => {
      AccountsLimits.update(
        { _id: limits._id },
        { $set: limits },
        { upsert: true },
        (error, result) => {
          if (error) {
            logger.error(error);
            return reject({
              statusCode: 500,
              body: {
                type: 'system',
                message: 'Cannot update account_limits'
              }
            });
          }
          resolve(result);
        }
      );
    });

  }

  getData() {
    let callStack = [];
    callStack.push(memberApi.account.getAccountSubscriptionsByUserId(this.userId)
      .then(response => {
        if (response.statusCode == 200) {
          return response.body.map(subscription => {
            subscription._id = subscription.productId;
            delete subscription.productId;
            subscription.userId = subscription.memberId;
            delete subscription.memberId;
            return subscription;
          });
        }
        else {
          return Promise.reject();
        }
      }));

    callStack.push(AccountsInfo.findOne({
        _id: this.userId
      })
        .lean()
    );

    return Promise.all(callStack);
  }

  _migrateData(subscriptions, user) {
    const limits = this._groupLimits(subscriptions);

    let projectMigrateInstange = new ProjectMigrate(this.userId, limits);

    return Promise.all([
      projectMigrateInstange.menu(),
      projectMigrateInstange.PublishedProjects(subscriptions, user),
    ]);
  }

  _getPreviousSubscriptions(subscriptionId = null) {
    return AccountsSubscriptions.find({ userId: this.userId })
      .lean()
      .then(subscriptions => {
        if (subscriptionId) {
          return subscriptions.find(s => s._id == subscriptionId);
        }

        return subscriptions;
      });
  }

  installed(subscriptions) {
    return this._update(subscriptions);
  }

  planChanged(subscriptions) {
    const nextSub = new SubscriptionModel(subscriptions.find(s => s._id == this.payload.productId));
    ProjectMigrate.subscriptionChanged(nextSub, 'planChanged');
    return ProjectMigrate.planChanged(nextSub);
  }

  featureChanged(subscriptions) {
    const nextSub = new SubscriptionModel(subscriptions.find(s => s._id == this.payload.productId));

    return this._getPreviousSubscriptions(this.payload.productId)
      .then(subs => this._update(subscriptions).then(() => subs))
      .then(previousSubscription => {

        const prevSub = new SubscriptionModel(previousSubscription);

        if (!HasEcommerceLockTypeSpecification.isSatisfiedBy(prevSub, nextSub)) return;

        if (PausingEcommerceFeatureSpecification.isSatisfiedBy(prevSub, nextSub)) {
          return ecommerceApiServiceV2.lockStores(this.userId);
        }

        if (ResumingEcommerceFeatureSpecification.isSatisfiedBy(prevSub, nextSub)) {
          return ecommerceApiServiceV2.unlockStores(this.userId);
        }

        if (ExpiringActiveEcommerceFeatureSpecification.isSatisfiedBy(prevSub, nextSub)) {
          return ecommerceApiServiceV2.disconnectStores(this.userId, true);
        }

        if (ExpiringPausedEcommerceFeatureSpecification.isSatisfiedBy(prevSub, nextSub)) {
          return ecommerceApiServiceV2.unlockStores(this.userId)
            .then(() => ecommerceApiServiceV2.disconnectStores(this.userId))
        }
      })
      .then(() => {
        return ProjectMigrate.republish(nextSub);
      });
  }

  migrated(subscriptions) {
    let prevSubs, nextSubs;
    return this._getPreviousSubscriptions(this.payload.productId)
      .then(subs => this._update(subscriptions).then(() => subs))
      .then(previousSubscription => {
        const nextSubscription = subscriptions.find(s => s._id == this.payload.productId);

        prevSubs = new SubscriptionModel(previousSubscription);
        nextSubs = new SubscriptionModel(nextSubscription);

        if (prevSubs.isEcommerceV2() && !nextSubs.isEcommerceV2()) {
          return ecommerceApiServiceV2.disconnectStores(this.userId);
        }

        if (prevSubs.isEcommerceV2() && EcommercePlanChangedSpecification.isSatisfiedBy(prevSubs, nextSubs)) {
          return ecommerceApiServiceV2.updateStores(this.userId, { subscription: { planId: nextSubs.getStorePlan() } });
        }

        if (prevSubs.isEcommerceV1() && !nextSubs.isEcommerceV1()) {
          return this._disconnectEcommerce(previousSubscription).then(() => ecommerceApiService.subscriptionUpdated(this.userId, nextSubscription, `${ this.status }_down`, previousSubscription));
        }

        if (!prevSubs.isEcommerceV1() && nextSubs.isEcommerceV1()) {
          return ecommerceApiService.subscriptionUpdated(this.userId, nextSubscription, `${ this.status }_up`);
        }

        if (prevSubs.isTrial() && !nextSubs.isTrial() && nextSubs.isEcommerceV1() && prevSubs.isEcommerceV1()) {
          return ecommerceApiService.subscriptionUpdated(this.userId, nextSubscription, `${ this.status }_up`);
        }
      })
      .then(() => {
        if (prevSubs.getStatus() !== 'active' && nextSubs.getStatus() === 'active') {
            return ProjectMigrate.republishOnSuspend(nextSubs);
        }
      })
  }

  renewed(subscriptions) {
    return this._getPreviousSubscriptions(this.payload.productId)
      .then(subs => this._update(subscriptions).then(() => subs))
      .then(previousSubscription => {
        const nextSubscription = subscriptions.find(s => s._id == this.payload.productId);

        const prevSubs = new SubscriptionModel(previousSubscription);
        const nextSubs = new SubscriptionModel(nextSubscription);

        if (prevSubs.getStatus() !== 'active' && nextSubs.getStatus() === 'active') {
          return ecommerceApiService.subscriptionUpdated(this.userId, nextSubscription, this.status)
            .then(() => ProjectMigrate.republishOnSuspend(nextSubscription));
        }
      });
  }

  statusChanged(subscriptions) {
    let callStack = subscriptions.map(subscription => {
      this[subscription.status + 'Status']([subscription]);
    });

    return Promise.all(callStack);
  }

  activeStatus(subscriptions) {
    const subscription = new SubscriptionModel(subscriptions.find(s => s._id == this.payload.productId));
    return this._update(subscriptions)
      .then(() => {
        if (subscription.isEcommerceV2()) {
          return ecommerceApiServiceV2.resumeStores(this.userId);
        } else if (subscription.isEcommerceV1()) {
          return Promise.all([
            ecommerceApiService.subscriptionUpdated(this.userId, subscription, this.status),
            ecommerceApiService.resumeStores(this.userId),
          ]);
        }
      }).then(() => ProjectMigrate.republishOnSuspend(subscription));
  }

  suspendedStatus(subscriptions) {
    const subscription = new SubscriptionModel(subscriptions.find(s => s._id == this.payload.productId));
    return this._update(subscriptions)
      .then(() => {

        const callStack = [ProjectMigrate.unpublishProject(subscription)];

        if (subscription.isEcommerceV2()) {
          callStack.push(ecommerceApiServiceV2.suspendStores(this.userId, subscription));
        } else if (subscription.isEcommerceV1()) {
          callStack.push(ecommerceApiService.subscriptionUpdated(this.userId, subscription, this.status));
          callStack.push(ecommerceApiService.suspendStores(this.userId));
        }

        return Promise.all(callStack);
      });
  }

  terminatedStatus(subscriptions) {
    const subscription = new SubscriptionModel(subscriptions.find(s => s._id == this.payload.productId));
    return this._update(subscriptions)
      .then(() => {

        const callStack = [ProjectMigrate.unpublishProject(subscription)];

        if (subscription.isEcommerceV2()) {
          callStack.push(ecommerceApiServiceV2.suspendStores(this.userId));
        } else if (subscription.isEcommerceV1()) {
          callStack.push(ecommerceApiService.subscriptionUpdated(this.userId, subscription, this.status));
          callStack.push(ecommerceApiService.suspendStores(this.userId));
        }

        return Promise.all(callStack);
      });
  }

  renewal_dueStatus(subscriptions) {
    const subscription = new SubscriptionModel(subscriptions.find(s => s._id == this.payload.productId));

    return this._update(subscriptions)
      .then(() => {
        if (subscription.isEcommerceV1()) {
          return ecommerceApiService.subscriptionUpdated(this.userId, subscription, this.status);
        }
      });
  }

  expiredStatus(subscriptions) {
    const subscription = new SubscriptionModel(subscriptions.find(s => s._id == this.payload.productId));
    return this._update(subscriptions)
      .then(() => {
        const callStack = [ProjectMigrate.unpublishProject(subscription)];

        if (subscription.isEcommerceV2()) {
          callStack.push(ecommerceApiServiceV2.suspendStores(this.userId));
        } else if (subscription.isEcommerceV1()) {
          callStack.push(ecommerceApiService.subscriptionUpdated(this.userId, subscription, this.status));
          callStack.push(ecommerceApiService.suspendStores(this.userId));
        }

        return Promise.all(callStack);
      });
  }

  archivedStatus(subscriptions) {
    const subscription = new SubscriptionModel(subscriptions.find(s => s._id == this.payload.productId));

    return this._update(subscriptions)
      .then(() => {
        const callStack = [ProjectMigrate.unpublishProject(subscription)];

        if (subscription.isEcommerceV2()) {
          callStack.push(ecommerceApiServiceV2.disconnectStores(this.userId));
        } else if (subscription.isEcommerceV1()) {
          const promise = this._disconnectEcommerce(subscription)
            .then(() => ecommerceApiService.subscriptionUpdated(this.userId, subscription, this.status));

          callStack.push(ecommerceApiService.suspendStores(this.userId));
          callStack.push(promise);
        }

        return Promise.all(callStack);
      });
  }
};

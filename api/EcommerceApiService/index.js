'use strict';

const models = require('@sp/mongoose-models');

const request = require('../../utils/request');
const config = require('../../config');

const ApiKeyModel = models.ApiKey;
const ecommerceApiUrl = `${config.apiUrls.ecommerceService}`;

module.exports = {
  createStore(projectId, template, accessToken) {
    return request(`${ ecommerceApiUrl }/${ projectId }/store/create/?templateIndex=${ template }&systemCreate=true`, {
      timeout: 60 * 1000,
      method: "POST",
      body: {
        "storeProvider":"ecwid",
        "subscriptionName":"SITEPLUS_BASIC",
      }
    }, accessToken);
  },

  clearCloned(projectId, accessToken) {
    return request(`${config.apiUrls.ecommerceService}/${projectId}/project/clear-cloned`, {
      method: 'PUT',
    }, accessToken);
  },
  updateStoreProfile(projectId, bodyData, userId, accessToken) {
    const url = `${ecommerceApiUrl}/${projectId}/profile/update/`;
    const options = {
      method: 'POST',
      body: bodyData,
    };
    let setApiKeyPromise;

    if (!accessToken) {
      setApiKeyPromise = ApiKeyModel.find({})
        .then(([apiKey]) => options.qs = { apiKey: apiKey._id, userId })
    }

    return (setApiKeyPromise || Promise.resolve())
      .then(() => request(url, options, accessToken))
  },

  disconnectStore(userId, subscription, apiKey) {
    const url = `${ config.apiUrls.ecommerceService }/project/disconnect-by-subscription`;

    return request(url, {
      timeout: 60 * 1000,
      method: 'DELETE',
      qs: {
        apiKey: apiKey,
        userId: userId,
        subscriptionId: subscription._id,
        storeProvider: subscription.features.find(f => f.technicalName === 'storeProvider').featureValue
      },
      body: {
        subscription
      }
    })
  },

  subscriptionUpdated(userId, subscription, action, prevSubs) {
    const url = `${ config.apiUrls.ecommerceService }/users/${ userId }/subscription`;

    return ApiKeyModel.findOne({}).lean()
    .then(apiKey => {
      return request(url, {
        timeout: 60 * 1000,
        method: 'PUT',
        qs: {
          apiKey: apiKey._id,
          userId
        },
        body: { subscription, action, prevSubscription: prevSubs },
      });
    })
    
  },

  suspendStores(userId) {
    const url = `${ config.apiUrls.ecommerceService }/users/${ userId }/suspend`;

    return ApiKeyModel.findOne({}).lean()
    .then(apiKey => {
      return request(url, {
        timeout: 60 * 1000,
        method: 'PUT',
        qs: {
          apiKey: apiKey._id,
          userId
        },
        body: {},
      });
    })
    
  },

  resumeStores(userId) {
    const url = `${ config.apiUrls.ecommerceService }/users/${ userId }/resume`;

    return ApiKeyModel.findOne({}).lean()
    .then(apiKey => {
      return request(url, {
        timeout: 60 * 1000,
        method: 'PUT',
        qs: {
          apiKey: apiKey._id,
          userId
        },
        body: {},
      });
    })
    
  }
}

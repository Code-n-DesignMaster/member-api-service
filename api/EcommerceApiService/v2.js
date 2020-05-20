const { Request } = require('@sp/nodejs-utils').classes; 
const config = require('../../config');

const request = new Request(`${config.apiUrls.ecommerceService}/v2.0`).freezy();

const debug = require('debug')('app:api:ecommerce:v2');

module.exports = {
  connectStore(projectId, accessToken) {
    return request.exec({
      method: 'POST',
      body: {
        templateId: 1,
        createComponents: false,
      },
      endpoint: `/projects/${ projectId }/store`, 
      bearer: accessToken
    });
  },

  disconnectStore(projectId, accessToken) {
    return request.exec({ 
      method: 'DELETE',
      endpoint: `/projects/${ projectId }/store`, 
      bearer: accessToken
    });
  },

  suspendStores(userId, subscription) {
    return request.exec({ 
      method: 'DELETE',
      body: subscription,
      endpoint: `/users/${userId}/stores/suspend`, 
      apiKey: config.apiKeys.servicesApiKey,
    });
  },

  disconnectStores(userId, freemium) {
    let url = `/users/${userId}/stores/disconnect`;
    if(freemium) url = url + `?freemium=true`;

    return request.exec({ 
      method: 'DELETE',
      endpoint: url,
      apiKey: config.apiKeys.servicesApiKey,
    });
  },

  resumeStores(userId) {
    return request.exec({ 
      method: 'POST',
      endpoint: `/users/${userId}/stores`, 
      apiKey: config.apiKeys.servicesApiKey,
    });
  },

  lockStores(userId, subscription) {
    return request.exec({ 
      method: 'PUT',
      endpoint: `/users/${userId}/stores/lock`, 
      apiKey: config.apiKeys.servicesApiKey,
    });
  },

  unlockStores(userId, subscription) {
    return request.exec({ 
      method: 'PUT',
      endpoint: `/users/${userId}/stores/unlock`, 
      apiKey: config.apiKeys.servicesApiKey,
    });
  },

  updateStores(userId, body) {
    return request.exec({ 
      method: 'PUT',
      body,
      endpoint: `/users/${userId}/stores`, 
      apiKey: config.apiKeys.servicesApiKey,
    });
  },

  updateDomain(projectId, userId) {
    return request.exec({ 
      method: 'PUT',
      endpoint: `/projects/${projectId}/store/domain?userId=${ userId }`, 
      apiKey: config.apiKeys.servicesApiKey,
    }).catch(() => {});
  }
}

'use strict';

const config = require('../../../../config');
const host = config.apiUrls.editorService;

module.exports = (components) =>
  (projectId, accessToken) => {
    const request = components.request;

    return Promise.all([
      request(`${ host }/pages/${projectId}/removeStorePage`, { 
        method: 'PUT',
      }, accessToken),

      request(`${ host }/${projectId}/header/shopping-cart`, { 
        method: 'DELETE', 
        body: {
          elementName: 'shopping_cart'
        }
      }, accessToken),

      request(`${ host }/${projectId}/header/options`, { 
        method: 'PUT', 
        body: {
          options: {},
          action: 'remove'
        }
      }, accessToken),

      request(`${host}/${projectId}/sections/ecommerce`, {
        method: 'DELETE',
        timeout: 60 * 1000,
      }, accessToken),
    ]);
  }

'use strict';

const request = require('../../utils/request');
const apis = {
  member: require('./member'),
  socket: require('./socket'),
  editor: require('./editor'),
  webHook: require('./webHook'),
  imageService: require('./imageService'),
  frontendApp: require('./frontendApp'),
  fileStorageService: require('./fileStorageService'),
  siteHostingUpdater: require('./siteHostingUpdater'),
};

class ApiFactory {
  constructor(apis = {}) {
    this._components = {};
    this._apis = {};
    this._registerApis(apis);
  }

  setComponent(componentName, component) {
    this._components[componentName] = component;
    return this;
  }

  _getComponents() {
    return this._components;
  }

  _registerApi(apiName, apiClass) {
    this._apis[apiName] = apiClass;
    return this;
  }

  _registerApis(apis = {}) {
    for (const apiName in apis) {
      this._registerApi(apiName, apis[apiName]);
    }
  }

  getApi(apiName) {
    return this._apis[apiName](this._getComponents());
  }
}

module.exports = new ApiFactory(apis).setComponent('request', request);

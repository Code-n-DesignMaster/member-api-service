'use strict';

const { get } = require('lodash');
const config = require('../../../../config');
const logger = require('../../../../helpers/logger');

const subdomainAppUrl = config.apiUrls.subdomainApp;

const models = require('@sp/mongoose-models');

const Project = models.Project;

module.exports = components => (projectId, accessToken, customUrl = null) => {
  logger.debug('render', {
    projectId, accessToken, customUrl,
  });
  const { request } = components;
  const options = {
    method: 'PUT',
    body: {
      getGeneratedStyles: true,
    },
    headers: {
      'Accept': 'text/css',
    },
  };
  let url = customUrl || `${subdomainAppUrl}/styles/${projectId}.css`;

  return Project.findOne({ _id: projectId }).lean()
    .then((project) => {
      const storageType = get(project, 'options.stylesSaving', null);
      if (storageType && storageType === 'S3') {
        url = `${subdomainAppUrl}/v2.0/styles/${projectId}.css`;
      }
      if (!accessToken) {
        url += `?apiKey=${config.apiKeys.servicesApiKey}`;
        return request(url, options, accessToken);
      }
      return request(url, options, accessToken);
    })
    .then(res => res.body);
};

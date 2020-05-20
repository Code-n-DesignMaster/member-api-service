'use strict';

const request = require('../utils/request');

const config = require('../config');
const screenshotsUrl = `${config.apiUrls.workersApi}/screenshots`;
const publisherUrl = `${config.apiUrls.workersApi}/publisher`;
const archivatorUrl = `${config.apiUrls.workersApi}/archivator`;

const servicesApiKey = config.apiKeys.servicesApiKey;

module.exports = {
  copyScreenshots,
  partnerCopyScreenshots,
  copyScreenshotsFromProject,
  publish,
  unpublish,
  setParkingPage,
  saveProjectSnapshot,
  blogTagAdded,
  blogTagDeleted
};

function copyScreenshots(projectId, { accessToken, apiKey, userId, }) {
  const url = `${screenshotsUrl}/projects/${projectId}/copySection`;
  const options = { method: 'PUT' };

  if (!accessToken) { options.qs = { apiKey, userId }; }

  return request(url, options, accessToken);
}

function partnerCopyScreenshots(projectId, apiKey) {
  const url = `${screenshotsUrl}/partner/projects/${projectId}/copySection?apiKey=${ apiKey }`;
  const options = { method: 'PUT' };
  return request(url, options);
}

function copyScreenshotsFromProject(projectId, parentProjectId, accessToken) {
  const url = `${screenshotsUrl}/projects/${projectId}/copyProjectSections`;
  const options = {
    method: 'PUT',
    body: {
      parentProjectId
    }
  };
  return request(url, options, accessToken);
}

function publish(projectId, data) {
  const url = `${publisherUrl}/project/${projectId}/publish`;
  const options = {
    method: 'POST',
    body: data,
    json: true
  };
  return request(url, options);
}

function unpublish(projectId, data) {
  const url = `${publisherUrl}/project/${projectId}/unpublish`;
  const options = {
    method: 'POST',
    body: data,
    json: true
  };
  return request(url, options);
}

function setParkingPage(data) {
  const url = `${publisherUrl}/parking-page`;
  const options = {
    method: 'PUT',
    body: data,
    json: true
  };
  return request(url, options);
}

function saveProjectSnapshot(projectId) {
  const url = `${archivatorUrl}/project-snapshot/${projectId}?apiKey=${ servicesApiKey }`;
  const options = {
    method: 'POST',
    json: true
  };
  return request(url, options);
}

function blogTagAdded(projectId, data) {
  const url = `${publisherUrl}/project/${projectId}/blog/tag-added`;
  const options = {
    method: 'POST',
    body: data,
    json: true
  };
  return request(url, options);
}

function blogTagDeleted(projectId, data) {
  const url = `${publisherUrl}/project/${projectId}/blog/tag-deleted`;
  const options = {
    method: 'POST',
    body: data,
    json: true
  };
  return request(url, options);
}

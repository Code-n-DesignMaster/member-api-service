'use strict';

const logger = require('../../../helpers/logger');

const apiComponent = require('../../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const workersApi = require('../../../api').WorkersApi;
const projectApi = require('../../../api').ProjectApiService;

const checkHostingForPublish = require('@sp/nodejs-hosting-client/checkHostingForPublish');

const models = require('@sp/mongoose-models');
const PublishedProject = models.PublishedProject;
const Project = models.Project;

module.exports = class {
  constructor(userId, status, payload) {
    this.userId = userId;
    this.status = status;
    this.payload = payload;
    this.subscriptionId = payload.productId;
  }

  process() {
    const requiredFields = [
      'productId',
      'host',
      'username',
      'password',
      'rootFolder',
      'resellerId',
      'loginUrl'
    ];

    for (let i = 0; i < requiredFields.length; i++) {
      let field = requiredFields[i];
      if (this.payload[field] === undefined) {
        return Promise.reject({
          "type": "validation",
          "messages": [
            {
              "field": `${field}`,
              "messages": `${field} is required`
            }
          ]
        })
      }
    }

    let hostingDetails = {};

    if (this.payload.rootFolder !== null) {
      hostingDetails.rootFolder = this.payload.rootFolder;
    }

    hostingDetails.output = this.payload.publishTransferProtocol || 'sftp';
    hostingDetails.publishTransferProtocol = this.payload.publishTransferProtocol || 'sftp';
    hostingDetails.host = this.payload.host;
    hostingDetails.port = this.payload.port || 22;
    hostingDetails.type = this.payload.type; // later need add prop tp requiredFields
    hostingDetails.username = this.payload.username;
    hostingDetails.password = this.payload.password;
    hostingDetails.resellerId = this.payload.resellerId;
    hostingDetails.loginUrl = this.payload.loginUrl;

    try {
      this[this.status](hostingDetails);
      return Promise.resolve(hostingDetails);
    }
    catch (err) {
      logger.error(err);
      return Promise.reject(err);
    }
  }

  getData() {
    return memberApi.account.getHosting(this.payload.productId, this.userId)
      .then(response => response.body);
  }

  created(hostingDetails) {
    return memberApi.account.getAccountPermission(null, this.userId)
      .then(permissionRes => {
        const settingsCategory = permissionRes.body && permissionRes.body.settingsCategory;
        if (
          settingsCategory
          && settingsCategory
            .find(settingCat =>
              settingCat.categoryTechnicalName === 'relay'
              && settingCat.settings
                .find(setting =>
                  setting.settingTechnicalName === 'prePublishCheck'
                  && setting.value === 'true'
                )
            )
        ) {
          return checkHostingForPublish(hostingDetails);
        }
        return true;
      })
      .then(canPublish => {
        if (canPublish) {
          return workersApi.setParkingPage(hostingDetails);
        }
        logger.info(`Hosting not empty!`, hostingDetails);
      })
      .catch(err => {
        logger.error('eventHosting created Error:', err)
      });
  }

  async updated(hostingDetails) {
    try {
      const publishedProject = await PublishedProject.findOne({subscriptionId: this.subscriptionId.toString()}).select('_id projectId').lean();

      if(!publishedProject) {
        logger.info(`Published project not found for:`, this.subscriptionId);
        logger.info(`ParkingPage send for subscription`, this.subscriptionId);
        return workersApi.setParkingPage(hostingDetails);
      }

      const projectId = publishedProject.projectId;
      const project = await Project.findOne({_id: projectId}).lean();

      if(!project.published) {
        logger.info(`Project not published:`, this.subscriptionId);
        logger.info(`ParkingPage send for subscription`, this.subscriptionId);
        return workersApi.setParkingPage(hostingDetails);
      }

      logger.info(`Project republish sent`, publishedProject.projectId);
      return projectApi.republish(publishedProject.projectId, this.userId);
    } catch (err) {
      logger.error('eventHosting updated Error:', err);
    }
  }

};

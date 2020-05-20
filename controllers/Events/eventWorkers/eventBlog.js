'use strict';

const debug = require('debug')('app:controller:Events:Blog');
const models = require('@sp/mongoose-models');
const Project = models.Project;
const ProjectSettings = models.ProjectSettings;
const ProjectDomain = models.ProjectDomain;
const AccountsSubscriptions = models.AccountsSubscriptions;

const { NotAllowed } = require('@sp/nodejs-utils').errors;

const apiComponent = require('../../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

const workersApi = require('../../../api').WorkersApi;

module.exports = class {
  constructor(userId, status, payload) {
    this.status = status;
    this.payload = payload;
  }

  async process() {
    debug(`Status: ${this.status}`);
    debug(`Payload`, this.payload);

    const requiredFields = [
      'blogId', 'tagId', 'title', 'slug'
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

    const { blogId } = this.payload;

    let projectId = null;
    let userId = null;

    try {
      const settings = await ProjectSettings.findOne({ 'blog.blogId': blogId });
      if (!settings || settings.blog.enabled !== true) return {};

      const project = await Project.findOne({ _id: settings.project, published: true });
      if (!project) return {};

      projectId = project._id;
      userId = project.userId;

      const [primaryDomain, freeHostingResponse] = await Promise.all([
        ProjectDomain.findOne({'isPrimary' : true, project: projectId}),
        memberApi.account.getFreeHosting(userId)
      ]);

      let partnerFreeHosting = true;
      const freeHostingObj = freeHostingResponse.body;

      if (primaryDomain.type === 'custom' || primaryDomain.type === 'free') {
        partnerFreeHosting = false;
      }

      if (primaryDomain.type === 'free' && (freeHostingObj && freeHostingObj.freeHosting && freeHostingObj.freeHosting.isInternalCluster !== 1)) {
        partnerFreeHosting = true;
      }

      const publishedToHosting = !(primaryDomain.type === 'custom' || (primaryDomain.type === 'free' && !partnerFreeHosting));

      if (!publishedToHosting) return {};
      debug(`BlogId:${blogId} update publish with ${this.status}`);

      const hosting = await this.getHosting(userId);

      if (!hosting.host) throw new NotAllowed(`HOSTING_NOT_FOUND`);

      hosting.rootFolder = hosting.rootFolder || 'public_html';
      hosting.output = hosting.publishTransferProtocol || 'sftp';
      hosting.port = hosting.port || 22;
      hosting.type = hosting.type || '';

      await this[this.status](projectId, hosting, this.payload);

    } catch (err) {
      logger.error(err);
      return await Promise.reject(err);
    }
  };

  tagAdded(projectId, hosting, payload) {
    hosting.eventData = payload;
    return workersApi.blogTagAdded(projectId, hosting);
  }

  tagDeleted(projectId, hosting, payload) {
    hosting.eventData = payload;
    return workersApi.blogTagDeleted(projectId, hosting);
  }

  getHosting(userId) {
    return AccountsSubscriptions.findOne({userId})
      .then((subscription) => {
        return memberApi.account.getHosting(subscription._id, userId)
          .then((result => result.body));
      });
  }
};

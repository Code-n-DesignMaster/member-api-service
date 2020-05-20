'use strict';

// const _ = require('lodash');
const uuid = require('uuid/v4');
const models = require('@sp/mongoose-models');

const logger = require('../../helpers/logger');

const PublishedProjectMetaInfo = models.PublishedProjectMetaInfo;

const {
  ProjectSettingsMapper
} = require('../../app/classes/mappers');

module.exports = {

  onProjectPublish(projectId, primaryDomain) {
    if (!projectId || !primaryDomain) {
      return logger.error('projectId & primaryDomain are required!')
    }

    ProjectSettingsMapper.one({project: projectId}).then((projectSettings) => {
      if (projectSettings.publishStatics !== false) {
        const defaultData = {
          $setOnInsert: {
            _id: uuid(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          domain: primaryDomain,
          publishedAt: new Date(),
          publishFails: [],
          staticUploaded: false,
          usedFiles: [],
        };

        PublishedProjectMetaInfo
          .updateOne(
            {projectId},
            defaultData,
            { upsert: true, new: true },
            (error, doc) => error && logger.error(error)
          );
      }
    });
  },

  onProjectUnpublish(projectId) {
    PublishedProjectMetaInfo
      .remove({projectId})
      // .findOne({projectId})
      // .then(doc => {
      //   console.log(doc);
      //   if (doc) { doc.remove(); }
      // })
      .catch(logger.error);
  },

};

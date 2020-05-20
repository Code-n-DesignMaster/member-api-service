'use strict';

const logger = require('../../helpers/logger');
const { NotFound } = require('@sp/nodejs-utils').errors;

const models = require('@sp/mongoose-models');
const ProjectDomains = models.ProjectDomain;

const ourPublish = require('./publish');
const partnerPublish = require('../Partner/publish');

const debug = require('debug')('app:ProjectPublish');

module.exports = (req, res, next) => {
  ProjectDomains.findOne(
    {
      project: req.params.projectId,
      isPrimary: true,
      deleted: {$ne: true}
    },
    (error, domain) => {
      if (error) {
        return next(error);
      }

      if (!domain) {
        return next(new NotFound('NO_DOMAIN_FOUND'));
      }

      req.body.domainId = domain._id;

      switch (domain.type) {
        case 'partner':
          debug("Partner Publish");
          partnerPublish(req, res, next);
          break;
        default:
          debug("Free Publish");
          ourPublish(req, res, next);
      }
    }
  );
};

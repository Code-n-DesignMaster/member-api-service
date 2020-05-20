'use strict';

const _ = require('lodash');

const { NotFound } = require('@sp/nodejs-utils').errors;

const models = require('@sp/mongoose-models');

const availableFields = [
  'providerType',
  'providerStoreId',
  'status',
  'subscription',
  'storeUrl',
  'populatedWithDefaultProducts'
];

module.exports = (req, res, next) => {
  const projectId = req.params.projectId;

  Promise.all([
    models.Project.findById(projectId).lean(),
    models.ProjectEcommerce.findOne({projectId}).lean(),
  ])
    .then(([projectDoc, projectEcomDoc]) => {
      if (!projectDoc) { throw new NotFound('PROJECT_NOT_FOUND'); }
      if (projectEcomDoc) { req.body.delete = true; } // EcomV2 exists

      if ('delete' in req.body && req.body.delete) {
        models.Project.updateOne(
          { _id: projectId },
          { $unset: { eCommerce: '' } }
        )
          .exec();
        return;
      }

      const eCommerce = projectDoc.eCommerce || {};

      availableFields.forEach(field => {
        if (field in req.body) { eCommerce[field] = req.body[field]; }
      });

      if (!_.isEmpty(eCommerce)) {
        models.Project.updateOne(
          { _id: projectId },
          { $set: { eCommerce } }
        )
          .exec();
      }

      return eCommerce;
    })
    .then(data => res.send(data || {}))
    .catch(next);
};

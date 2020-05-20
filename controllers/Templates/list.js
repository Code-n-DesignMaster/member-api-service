'use strict';

const _ = require('lodash');
const config = require('../../config');
const defaultStyles = require('@sp/nodejs-fixtures/template/styles');

const { templateUrlSuffix } = config;

const {
  ShowEcommerceTemplateSpecification,
  ShowTemplateVersionSpecification,
} = require('../../app/classes/specifications');

const { TemplateV2Mapper, TemplateMapper } = require('../../app/classes/mappers');
const { TemplateVersion, TemplateV2 } = require('@sp/mongoose-models');

module.exports = (req, res, next) => {
  getTemplates(req.accessToken, req.query)
    .then(result => res.send(result))
    .catch(error => next(error));
};

function getTemplates(accessToken, queries) {
  const query = {
    position: { $exists: true },
    hidden: { $ne: true },
    deleted: { $ne: true },
  };

  if (queries.editor) {
    query.title = { $ne: 'Blank' };
  }

  const projection = createProjection('title position templateIndex primaryVersion src _id link categories description versions type', 'styles', queries);
  const projectionVersion = createProjection('title locale templateIndex src _id link categories description hidden type versionName', 'styles', queries);

  return Promise
    .all([
      ShowEcommerceTemplateSpecification.isSatisfiedBy(accessToken),
      TemplateV2.find(query)
        .select(projection)
        .populate('versions', projectionVersion)
        .populate('categories')
        .sort({ position: 1 })
        .lean()

    ])
    .then(([isShowEcommerceTemplate, templates]) => {
      return templates
        .map(item => {
          const primary = item.versions.find(v => v._id === item.primaryVersion);

          item.versions = item.versions
            .filter(template => template._id !== item.primaryVersion)
            .filter(template => ShowTemplateVersionSpecification.isSatisfiedBy(template, isShowEcommerceTemplate));

          if (primary) {
            item._id = primary._id;
            item.src = primary.src;
            item.type = primary.type;
            item.versionName = primary.versionName;
            item.link = primary.link;
          }

          return item;
        })
        .filter(template => ShowTemplateVersionSpecification.isSatisfiedBy(template, isShowEcommerceTemplate))
        // Show only template with en locale version
        .reduce((acc, template) => {
          let showTemplate = true;

          template.versions.forEach((version) => {
            if (version.locale.includes('id')) {
              showTemplate = false;
            }
            delete version.locale;
          });

          if (showTemplate || accessToken) {
            acc.push(template);
            return acc;
          } else {
            return acc;
          }

        }, [])
    })
    .then((items) => {
      return { items, styles: _.pick(defaultStyles.data, Object.keys(queries)) };
    })
    .then(({ items, styles }) => {
      return items.map(item => {

        if (item.versions) {
          item.versions.map(item => {
            item.link = `${item.link}.${templateUrlSuffix}`;
            return item;
          });
        }
        item.link = `${item.link}.${templateUrlSuffix}`;
        item.categories = item.categories.map(item => item.name);
        item.styles = _.merge(item.styles, styles);

        return item;
      });
    });
}

function createProjection(string, field, object) {
  for (const key in object) {
    string += ` ${field}.${key} `;
  }
  return string;
}

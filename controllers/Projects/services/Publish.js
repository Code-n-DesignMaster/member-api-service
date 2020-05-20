'use strict';

const _ = require('lodash');
const unflatten = require('flat').unflatten;

const logger = require('../../../helpers/logger');
const responses = require('../../../utils/responses');

const defaultStyles = require('@sp/nodejs-fixtures/template/styles');
const models = require('@sp/mongoose-models');
const PublishedProject = models.PublishedProject;
const ProjectFormFields = models.ProjectFormFields;

const Project = require('./Project');
const Seeker = require('./Seeker');
const { BackToTopAccessableSpecification } = require('../../../app/classes/specifications');
const MenuMetaInclusion = require('../../../app/classes/MenuMetaInclusion');
const { ProjectEcommerceFormatter } = require('../../../app/formatters');

module.exports = class extends Project {

  constructor({ projectId, userId, resellerId, showAdvertisement, subscriptionId, mergedStatus, assetsVersion, permissions, resellerSettings, subscription }) {

    super({
      projectId,
      userId,
      deleted: false
    });

    this.resellerId = resellerId;
    this.showAdvertisement = showAdvertisement;
    this.subscriptionId = subscriptionId;
    this.mergedStatus = mergedStatus;
    this.permissions = permissions;
    this.assetsVersion = assetsVersion;
    this.resellerSettings = resellerSettings;
    this.subscription = subscription;
  }

  /**
   * Create project's publish data
   * @return {Promise}
   */
  async create() {
    try {
      const [project, pages, settings, ecommerce, template] = await this._dataForPublish();
      const premiumFeatures = this.getPremiumFeatures(this.subscription);

      this.seeker = new Seeker([...pages, template.header.section, template.footer.section], template.menu);
      this.seeker.findByNames(['form', 'redactor']);
      this.seeker.filterUrls();

      const updateObj = {
        name: project.name,
        settings: _.pick(settings, ['marketing', 'typography', 'responsiveEditing', 'notFoundPage', 'accounts', 'legal']),
        menu: new MenuMetaInclusion(template.menu).include(this.resellerSettings, this.showAdvertisement),
        styles: _.merge({}, defaultStyles.data, template.styles),
        header: template.header.section,
        footer: template.footer.section,
        pages,
        stickyElements: BackToTopAccessableSpecification.isSatisfiedBy(this.permissions) && template.stickyElement ? template.stickyElement.elements : [],
        resellerId: this.resellerId,
        subscriptionId: this.subscriptionId,
        showAdvertisement: this.showAdvertisement,
        imagesOptimized: false,
        mergedStatus: this.mergedStatus,
        eCommerce: ecommerce ? (new ProjectEcommerceFormatter(ecommerce, template.menu, this.subscription)).format() : {},
        blog: settings.blog
      };

      if (this.assetsVersion) {
        updateObj.assetsVersion = this.assetsVersion;
      }

      if (!_.isEmpty(project.eCommerce)) {
        if (project.eCommerce.storeUrl) {
          project.eCommerce.storeUrl = template.menu.list.find(i => i.homepage && i.ecommerce) === undefined ? project.eCommerce.storeUrl : '';
        }
        updateObj.eCommerce = project.eCommerce;
      }

      if(!_.isEmpty(premiumFeatures)) {
        updateObj.premiumFeatures = unflatten(premiumFeatures);
      }

      await PublishedProject.updateOne({
        projectId: this.projectId,
        userId: this.userId
      }, updateObj, { upsert: true });

      await this._saveForm(this.seeker.found.form)

    } catch (err) {
      logger.error(err);
      return Promise.reject(responses.onSystemError('Cannot create publish data'));
    }
  }

  getPremiumFeatures(subscription) {
    const features = subscription.features;
    return features.reduce((acc, feature) => {
      if(feature.technicalName.startsWith('premium.')) {
        acc[feature.technicalName] = feature.featureValue;
        return acc;
      }
      return acc;
    }, {})
  }

  /**
   * Get published project
   * @return {Promise}
   */
  info() {
    return PublishedProject.findOne({
      projectId: this.projectId,
      userId: this.userId
    })
      .select('-_id')
      .lean()
      .catch(error => {
        logger.error(error);
        return Promise.reject(responses.onSystemError('Cannot get published data'));
      });
  }


  /**
   * Get full info for publishing project
   * @return {Promise}
   */
  async _dataForPublish() {
    try {
      const [project, pages, settings, ecommerce, template] = await Promise.all([
        super.info('-_id name eCommerce'),
        super.pages('sections', { sections: '-_id section' }),
        super.settings('-_id marketing typography responsiveEditing notFoundPage accounts legal blog'),
        super.ecommerce(),
        super.template('-_id menu styles header footer stickyElement', {
          header: 'section',
          footer: 'section',
          menu: '-_id list unlinked hidden',
          stickyElement: '-_id elements'
        })
      ]);

      return [project, pages, settings, ecommerce, template];
    } catch (err) {
      logger.error(err);
      return Promise.reject(responses.onSystemError('Cannot get info for publishing'));
    }
  }

  /**
   * Save forms on pages
   * @param  {Array} pages
   * @return {Promise}
   */
  _saveForm(forms) {

    return ProjectFormFields.updateOne({
      projectId: this.projectId
    }, { forms }, {
      upsert: true
    });
  }
};

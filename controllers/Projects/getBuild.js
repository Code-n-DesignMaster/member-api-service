'use strict';

const co = require('co');
const _ = require('lodash');
const flatten = require('flat');

const config = require('../../config');
const logger = require('../../helpers/logger');
const request = require('../../utils/request');

const { NotFound } = require('@sp/nodejs-utils').errors;
const defaultStyles = require('@sp/nodejs-fixtures/template/styles');
const apiComponent = require('../../api/apiComponent');

const memberApi = apiComponent.getApi('member');

const domainApiServiceUrl = config.apiUrls.domainService;
const ecommerceApiServiceUrl = config.apiUrls.ecommerceService;

const models = require('@sp/mongoose-models');
const ProjectSettings = models.ProjectSettings;
const AccountsSettings = models.AccountsSettings;
const NotFoundPage = models.NotFoundPage;
const ProjectTemplatePage = models.ProjectTemplatePage;
const ProjectTemplate = models.ProjectTemplate;
const ProjectEcommerce = models.ProjectEcommerce;

const Reseller = models.Reseller;
const ProjectTemplateMenu = models.ProjectTemplateMenu;

const getProjectById = require('../../helpers/getProjectById');

const { BackToTopAccessableSpecification } = require('../../app/classes/specifications');
const { SubscriptionMapper } = require('@sp/nodejs-utils/classes/mappers');
const { ProjectEcommerceFormatter, EcommerceCountConnectedFormatter } = require('../../app/formatters');

module.exports = (req, res, next) => {
  const projectId = req.params.projectId;
  const showDeleted = req.query.deleted === 'true' ? 1 : 0;
  const subscription = new SubscriptionMapper(req.account.subscriptions).one();
  const isEcommerceSubscription = subscription.isEcommerceEnabled();

  const resellerId = req.user.reseller.resellerId;

  co(function* () {
    const
      query = {
        _id: req.params.projectId,
        userId: req.userId
      };

    if (!showDeleted) {
      query.deleted = false;
    }

    let queryCallStack = [
      getProjectById(req.params.projectId),
      ProjectTemplatePage
        .find({ projectId: query._id })
        .populate('sections', 'section')
        .select('sections')
        .lean()
        .then(pages => {
          return pages.map(page => {
            page.sections = page.sections.map(item => item.section);
            return page;
          });
        }),
      ProjectTemplate
        .findOne({ projectId: query._id })
        .populate('header', 'section')
        .populate('footer', 'section')
        .populate('stickyElement', 'elements')
        .populate('menu', 'list unlinked outOfPlan hidden -_id')
        .select('header footer menu beforeCreate stickyElement templateIndex')
        .lean(),
      ProjectSettings
        .findOne({ project: query._id })
        .select('-_id marketing optimizeImages responsiveEditing typography notFoundPage accounts theme blog advanced legal projectBgColor')
        .lean(),
      AccountsSettings
        .findOne({ userId: req.userId })
        .select('-__v -_id -userId')
        .lean(),
      ProjectEcommerce
        .find({ userId: req.userId })
        .lean(),
      NotFoundPage
        .find({})
        .sort({ title: 1 })
        .select('title')
        .lean()
    ];

    if (req.accessToken) {
      queryCallStack.push(
        request(
          `${domainApiServiceUrl}/projects/${query._id}/availableDomains`,
          { method: 'GET' },
          req.accessToken
        )
      );
      queryCallStack.push(getEcommerceCountConnectedByAccessToken(isEcommerceSubscription, req.params.projectId, req.accessToken));
    }
    else {
      queryCallStack.push(
        request(
          `${domainApiServiceUrl}/api-projects/${query._id}/availableDomains`,
          {
            method: 'GET',
            qs: {
              apiKey: req.query.apiKey,
              userId: req.query.userId
            }
          }
        )
      );

      queryCallStack.push(getEcommerceCountConnectedByApiKey(isEcommerceSubscription, req.params.projectId, req.query.apiKey, req.query.userId));
    }

    queryCallStack.push(memberApi.account.getAccountPermission(req.memberApiAccessToken, req.userId));
    queryCallStack.push(Reseller.findOne({ resellerId: resellerId.toString() }).select('settings').lean());

    const results = yield Promise.all(queryCallStack);

    const [project, pages, template, settings, accountSettings, projectEcommerce, notFoundPages, domains, ecommerceCountConnected, permisions, reseller] = results;

    const gdprEnable = reseller.settings.legalStatements.gdprEnable;
    const cookiesPolicyPage = findCookiesPolicyPageInVisibleMenu(template.menu);

    if(!gdprEnable && cookiesPolicyPage) {
      template.menu = yield updateMenu(projectId, template.menu, cookiesPolicyPage);
    }

    if (!project) {
      return Promise.reject(new NotFound('PROJECT_NOT_FOUND'));
    }

    if (!_.isEmpty(project.publishedProject)) {
      project.published = ((project.publishedProject.mergedStatus === 'active' || project.publishedProject.mergedStatus === 'renewal_due') && project.published);
    }

    delete project.publishedProject;
    project.account = { settings: accountSettings || {} };
    project.previewImage = '/' + project.template.src.name;
    project.template.src = '/' + project.template.src.name;
    project.template.templateIndex = template.templateIndex;
    project.header = template.header.section;
    project.footer = template.footer.section;
    project.stickyElements = BackToTopAccessableSpecification.isSatisfiedBy(permisions.body) && template.stickyElement ? template.stickyElement.elements : [];
    project.beforeCreate = template.beforeCreate;
    project.menu = template.menu;
    project.errorHash = settings.notFoundPage.projectPageId;

    const errorPage = getErrorPage(pages);
    const errorPageClassName = errorPage.sections[0].options.static.staticClass[0];

    project.errorTemplates = notFoundPages.map(item => {

      if (errorPageClassName === item.title) {
        item.active = true
      }

      return item;
    });

    settings.user = {
      email: req.account.user.email,
      shard: req.user.shard
    };

    project.bgColors = settings.projectBgColor;
    delete settings.projectBgColor;

    if(settings.blog && settings.blog.enabled === true) {
      settings.blog.settings = (settings.blog.settings) ? flatten(settings.blog.settings) : null;
    } else {
      delete settings.blog;
    }

    project.settings = settings;
    project.styles = _.merge({}, defaultStyles.data, project.projectTemplate.styles);
    project.pages = {};

    for (const page of pages) {
      project.pages[page._id] = page.sections;
    }

    delete project.projectTemplate;

    project.ssl = false;
    project.domains = domains.body;

    // detecting primary domain and defining link
    let primaryDomain = project.domains.find(domain => (domain) ? domain.isPrimary : false);
    if (!primaryDomain) {
      primaryDomain = project.domains.find(domain => domain.type === 'free');
      primaryDomain.isPrimary = true;
    }
    if (primaryDomain) {
      project.link = primaryDomain.link;
      project.ssl = primaryDomain.ssl;
    }

    let callStack = [getProjectBackgrounds(project._id)];

    if (!_.isEmpty(project.eCommerce) && req.accessToken) {
      callStack.push(request(
        `${ecommerceApiServiceUrl}/${project._id}/store/sso/`,
        { method: 'POST' },
        req.accessToken
        )
          .catch(error => {
            logger.error(error, {
              projectId: project._id,
              msg: 'Wrong data in database',
              ecommerce: project.eCommerce
            });
          })
      );
    }

    project.dependencies = {};

    if (isEcommerceSubscription) {
      if (subscription.isEcommerceV2()) {
        project.dependencies.ecommerceCountConnected = new EcommerceCountConnectedFormatter(
          projectEcommerce,
          subscription,
          projectId,
        ).format();

        project.eCommerce = (
          new ProjectEcommerceFormatter(
            projectEcommerce.find(e => e.projectId === projectId),
            project.menu,
            subscription,
          )
        ).format();
      } else {
        project.dependencies.ecommerceCountConnected = ecommerceCountConnected;
      }
    }

    return project;
  })
    .then(result => res.send(result))
    .catch(next);
};

function getProjectBackgrounds(projectId) { // this is excess request to db
  return new Promise((resolve, reject) => {
    ProjectSettings
      .findOne({ project: projectId })
      .select('projectBgColor -_id')
      .lean()
      .exec((err, project) => {
        if (err) {
          return reject(err);
        }
        resolve(project.projectBgColor);
      });
  });
}

function getEcommerceCountConnectedByAccessToken(isEcommerceSubscription, projectId, accessToken) {
  return new Promise((resolve, reject) => {
    if (isEcommerceSubscription) {
      request(
        `${ecommerceApiServiceUrl}/${projectId}/project/count-connected`,
        { method: 'GET' },
        accessToken
      )
        .then(res => {
          if (res.statusCode === 200) {
            return resolve(res.body);
          }

          resolve({});
        })
        .catch(error => {
          logger.error(error);
          resolve({});
        });
    }
    else {
      resolve({});
    }
  });
}

function getEcommerceCountConnectedByApiKey(isEcommerceSubscription, projectId, apiKey, userId) {
  return new Promise((resolve, reject) => {
    if (isEcommerceSubscription) {
      request(
        `${ecommerceApiServiceUrl}/${projectId}/project/count-connected`,
        {
          method: 'GET',
          qs: {
            apiKey,
            userId
          }
        }
      )
        .then(res => {
          if (res.statusCode === 200) {
            return resolve(res.body);
          }

          resolve({});
        })
        .catch(error => {
          logger.error(error);
          resolve({});
        });
    }
    else {
      resolve({});
    }
  });
}

function findCookiesPolicyPageInVisibleMenu(menuDoc) {
  const list = [];
  [ ...(menuDoc.list || []), ...(menuDoc.unlinked || []), ...(menuDoc.outOfPlan || [])].forEach(item => {
    list.push(item);
    item.children && item.children.length && list.push(...item.children);
  });

  return list.find(p => (p && p.type && p.type === 'cookiesPolicy'));
}

function updateMenu(projectId, menu, cookiesPolicyPage) {
  let newMenu = {
    hidden: [...menu.hidden, cookiesPolicyPage],
    unlinked: clearCookiesPolisyPage(menu.unlinked),
    outOfPlan: clearCookiesPolisyPage(menu.outOfPlan),
    list: clearCookiesPolisyPage(menu.list)
  };
  return ProjectTemplateMenu.findOneAndUpdate({projectId}, newMenu).then(() => newMenu);
}

function clearCookiesPolisyPage(submenu) {
  return submenu.reduce((acc, item) => {
    if(item.children) {
      item.children = item.children.reduce((_acc, child) => {
        if(child.type && child.type === 'cookiesPolicy') {
          return _acc;
        } else {
          _acc.push(child);
          return _acc;
        }
      }, []);
    }

    if(item.type && item.type === 'cookiesPolicy') {
      return acc;
    } else {
      acc.push(item);
      return acc;
    }
  }, []);
}

function getErrorPage (pages) {

  return pages.find(page => {
    const classNames = _.get(page.sections[0], 'options.static.staticClass', null);

    if (classNames) {
      classNames[0] = classNames[0].replace(/404-/, '404_');

      return /404/.test(classNames[0]);
    }
  });
}

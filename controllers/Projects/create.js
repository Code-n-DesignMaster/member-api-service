'use strict';
const _ = require('lodash');
const uuid = require('uuid/v4');
const querystring = require('querystring');

const config = require('../../config');
const copyIcons = require('../../helpers/copyIcons');
const logger = require('../../helpers/logger');
const request = require('../../utils/request');
const hasher = require('../../utils/hasher');

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const webHookApi = apiComponent.getApi('webHook');
const editorService = apiComponent.getApi('editor');

const workersApi = require('../../api').WorkersApi;
const EmbedApiService = require('../../api').EmbedApiService;
const ecommerceApiService = require("../../api").EcommerceApiService;
const ecommerceApiServiceV2 = require("../../api/EcommerceApiService/v2");
const Validation = require('@sp/nodejs-validation')({});
const { V2AccountSubscriptionsSpecification } = require('@sp/nodejs-utils/classes/specifications');
const errors = require('@sp/nodejs-utils/errors');

const handlers = require('../../helpers/createHandlers');

const Menu = require('../../utils/classes/Menu');
const { updateSectionsLinks, updateSectionsEmbedBlocks } = require('./utils');
const { SystemPageMapper } = require('../../app/classes/mappers');
const { ProjectTemplateSectionModel, ProjectTemplatePageModel, MenuItemModel } = require('../../app/classes/models');

const models = require('@sp/mongoose-models');
const Reseller = models.Reseller;
const Project = models.Project;
const ProjectSettings = models.ProjectSettings;
const ProjectDomain = models.ProjectDomain;
const ProjectTemplate = models.ProjectTemplate;
const ProjectTemplateMenu = models.ProjectTemplateMenu;
const ProjectTemplatePage = models.ProjectTemplatePage;
const ProjectTemplateSection = models.ProjectTemplateSection;
const ProjectStickyElement = models.ProjectStickyElement;
const TemplateSection = models.TemplateSection;
const TemplateEmbedBlock = models.TemplateEmbedBlock;
const TemplatePage = models.TemplatePage;
const Template = models.TemplateVersion;
const Keys = models.AutocompleteKeys;

const projectCreated = memberApi.account.projectCreated;

const debug = require('debug')('app:controller:Projects.create');

const COOKIES_POLICY_SYSTEM_PAGE_NAME = 'Privacy and cookies policy';

module.exports = (req, res, next) => {
  const limits = req.account.limits;

  debug('Account info', `userId:${!!req.account.userId}`, `user:${!!req.account.user}`, `subscriptions:${!!req.account.subscriptions}`, `limits:${!!limits}`);

  let projectId;
  let template;
  let projectTemplate;
  let maxAllowedProjects = limits.maxAllowedProjects;
  let outOfPlanLimit = limits.outOfPlanLimit;
  let outOfPlan;
  let domainName;

  let dify = (req.body.dify === undefined) ? false : req.body.dify;

  getTemplate(req.body.templateId)
    .then(result => {
      if (!result) {
        return Promise.reject(new errors.NotFound('TEMPLATE_NOT_FOUND'));
      }
      template = result;
      return Promise.resolve();
    })
    .then(() => getUserProjectsCount(req.userId))
    .then(result => {
      if (result > maxAllowedProjects) {
        return Promise.reject(new errors.NotAllowed('CANT_CREATE_PROJECTS_LIMIT'));
      }

      outOfPlan = (result >= outOfPlanLimit);
      return Promise.resolve();
    })
    .then(() => {
      const data = {
        userId: req.userId,
        templateId: req.body.templateId,
        hasChangesAt: outOfPlan ? null : new Date(),
        resellerId: req.user.resellerId
      };

      let callStack = [
        createProject(data, template, dify),
        getCopyright(req.memberApiAccessToken, req.user.id),
        TemplateEmbedBlock.find({ templateIndex: template.templateIndex, versionName: template.versionName, locale: template.locale }),
      ];

      if (req.body.dify !== undefined) {
        callStack.push(isAddressValid(req.body.dify.payload));
      }

      return Promise.all(callStack);
    })
    .then(results => {
      projectId = results[0]._id;

      if (results[3] !== undefined) {
        req.body.dify.payload.validMapAddress = results[3];
      }

      if (!dify) {
        dify = {
          payload: {copyright: results[1]}
        }
      }

      return createProjectTemplate(req, projectId, template, limits.maxAllowedPages, dify, results[2])
        .then(result => projectTemplate = result);
    })
    .then(() => createProjectStickyElement(projectId))
    .then(() => {
      domainName = prepareDomainName(req.user.email);
      return generateDomain({
        name: domainName,
        userId: req.userId,
        projectId
      });
    })
    .then(result => attachDomainToProject(result.domainId, result.projectId))
    .then(result => attachProjectTemplateToProject(projectTemplate._id, result.projectId))
    .then(result => {

      if (template.versionName !== config.ecommerceVersionName) return result;

      if (req.query.withoutEcommerce) {
        return editorService.ecommerce.clearEcommerceComponents(projectId, req.accessToken)
          .then(() => result);
      }

      if (V2AccountSubscriptionsSpecification.isSatisfiedBy(req.account)) {
        return ecommerceApiServiceV2.connectStore(projectId, req.accessToken)
          .catch(() => editorService.ecommerce.clearEcommerceComponents(projectId, req.accessToken))
          .then(() => result);
      }

      return ecommerceApiService.createStore(projectId, projectTemplate.templateIndex, req.accessToken)
        .catch(() => editorService.ecommerce.clearEcommerceComponents(projectId, req.accessToken))
        .then(() => result);
    })
    .then(result => {
      res.send({_id: result.projectId, outOfPlan});

      if (req.body.dify === undefined) {
        projectCreated(projectId, req.memberApiAccessToken);
        copyIcons(template.link, projectId, {accessToken: req.accessToken});
        createScreenshots(projectId, {accessToken: req.accessToken});
      }
      else {
        projectCreated(projectId, false, req.userId);
        copyIcons(template.link, projectId, {apiKey: req.query.apiKey});
        createScreenshots(projectId, {apiKey: req.query.apiKey, userId: req.userId});
      }

      // send event to webHook api ------------
      try {
        const eventData = {
          type: 'project:created',
          payload: {
            memberId: req.userId,
            projectId: result.projectId,
            name: template.title,
            domain: `${domainName}.${req.user.reseller.domain}`
          }
        };

        webHookApi.sendEvent(eventData).then(response => {})
      } catch(err) {
        console.log('WebHookApi Error:', err);
        logger.error(err);
      }

    })
    .catch(next);
};

function getNum(nums) {
  let num = nums.length ? nums[nums.length - 1] + 1 : 1;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== i + 1) {
      num = i + 1;
      break;
    }
  }
  return num;
}

function getProjectNextNum(query) {
  return new Promise((resolve) => {
    Project
      .find(query)
      .sort('num')
      .select('num')
      .lean()
      .exec((error, projects) => {

        if (error) {
          logger.error(error);
          return resolve(1);
        }

        const num = getNum(projects.map(project => project.num));
        resolve(num);
      });
  });
}

function getTemplate(templateId) {
  return new Promise((resolve, reject) => {
    Template
      .findById(templateId)
      .populate('menu')
      .lean()
      .exec((error, template) => {
        if (error) {
          return reject(error);
        }

        resolve(template);
      });
  });
}

function getUserProjectsCount(userId) {
  return new Promise((resolve, reject) => {
    Project
      .count({userId, deleted: false})
      .exec((error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(parseInt(result) || 0);
      });
  });
}

function createProject(data, template, dify) {
  return new Promise((resolve, reject) => {
    const title = dify && dify.payload.businessName ? dify.payload.businessName : template.title;

    getProjectNextNum({
      userId: data.userId,
      name: title
    }).then(num => {
      Project.create(
        {
          userId: data.userId,
          name: title,
          template: data.templateId,
          num: num,
          hasChangesAt: data.hasChangesAt,
          resellerId: data.resellerId
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        });
    })

  });
}

function createProjectSettings(req, projectId, projectTemplate) {
  const userFromEU = isUserFromEU(req);

  return new Promise((resolve, reject) => {
    ProjectSettings.create(
      {
        project: projectId,
        notFoundPage: {
          projectPageId: projectTemplate.notFound
        },
        legal: {
          analytics: {
            active: !userFromEU
          },
          cookieBanner: {
            active: userFromEU
          }
        },
      },
      (error) => {
        if (error) {
          Project.findByIdAndRemove(projectId,
            () => logger.error('Removed project [' + projectId + '] document because of previous error'));

          return reject(error);
        }

        resolve();
      });
  });
}

function createProjectTemplate(req, projectId, template, maxPages, dify, embedBlocks) {
  return createProjectSections(req, projectId, template, dify, embedBlocks)
    .then(([template, systemPage]) => {
      return Promise.all([
        createProjectTemplateMenu(projectId, template, maxPages),
        createProjectSettings(req, projectId, template),
      ]);
    })
    .then(() => {
      delete template._id;
      template.projectId = projectId;

      return ProjectTemplate.create(template).catch(error => {
        Project.findByIdAndRemove(projectId);
        return Promise.reject(error);
      });
    });
}

function createProjectTemplateMenu(projectId, template, maxPages) {
  const _id = uuid();

  const menu = new Menu(projectId, template.menu, maxPages);

  const groupedList = menu.getGroupedListByLimit();
  template.menu = _id;
  groupedList._id = _id;

  return ProjectTemplateMenu.create(groupedList);
}

function updateProjectTemplateMenuElementHash(list, hash, newHash) {
  for (const elem in list) {
    if (list[elem].hash === hash) {
      list[elem].hash = newHash;
      return list;
    }

    // if has children
    if (list[elem].children) {
      const found = updateProjectTemplateMenuElementHash(list[elem].children, hash, newHash);

      if (found) {
        return list;
      }
    }
  }

  return false;
}

function saveProjectTemplateSections(projectId, sections) {
  return ProjectTemplateSection.insertMany(sections)
    .catch(error => {
      return Promise.reject(error);
    });
}

function saveProjectTemplatePages(projectId, pages) {
  return new Promise((resolve, reject) => {
    ProjectTemplatePage.create(pages, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    })
  });
}


function createProjectSections(req, projectId, template, dify, embedBlocks) {
  const userId = req.userId;
  const resellerId = req.user.resellerId;

  return Promise
    .all([
      TemplatePage.find({templateId: template._id}).select('sections').lean(),
      TemplateSection.find({templateId: template._id}).select('section').lean(),
      SystemPageMapper.populate({ name: COOKIES_POLICY_SYSTEM_PAGE_NAME }),
      Reseller.findOne({resellerId}).lean(),
    ])
    .then(([pages, sections, cookiesPolicy, resellerData]) => {
      const newHeaderId = uuid();
      const newFooterId = uuid();
      const IdsMap = { pages: {}, sections: {} };

      const cookiesPolicyPageSections = cookiesPolicy.sections.map(s => {
        return new ProjectTemplateSectionModel()
          .setId(uuid())
          .setProjectId(projectId)
          .setOptions(s.getOptions())
          .setElements(s.getElements())
          .setType(s.getType())
          .setName(s.getName());
      });

      const cookiesPolicyPage = new ProjectTemplatePageModel()
        .setId(uuid())
        .setProjectId(projectId)
        .setSections(cookiesPolicyPageSections.map(s => s.getId()));

      const cookiesPolicyPageMenuItem = new MenuItemModel()
        .setHash(cookiesPolicyPage.getId())
        .setName('Privacy and cookies policy')
        .setTag('privacy-and-cookies-policy')
        .setType('cookiesPolicy');

      if (dify !== false) {
        filterSectionForDify(template, sections, dify);
      }

      template.pages = template.pages.map(pageId => {

        const newPageId = uuid();
        const index = pages.findIndex(page => page._id === pageId);

        IdsMap.pages[pageId] = newPageId;

        if (template.notFound === pageId) {
          template.notFound = newPageId;
        }

        updateProjectTemplateMenuElementHash(template.menu.list, pageId, newPageId);
        updateProjectTemplateMenuElementHash(template.menu.unlinked, pageId, newPageId);

        pages[index]._id = newPageId;
        pages[index].projectId = projectId;

        pages[index].sections = pages[index].sections.map(sectionId => {

          const newSectionId = uuid();
          const index = sections.findIndex(section => section._id === sectionId);

          IdsMap.sections[sectionId] = newSectionId;

          if (index < 0) return;

          sections[index]._id = newSectionId;
          sections[index].section.options.hash = newSectionId;
          sections[index].projectId = projectId;

          return newSectionId;
        });

        return newPageId;
      });

      // add cookiesPolicyPage to project
      const resellerSettingsGDPREnable = _.get(resellerData, 'settings.legalStatements.gdprEnable', false);

      if (resellerSettingsGDPREnable && isUserFromEU(req)) {
        template.menu.unlinked.push(cookiesPolicyPageMenuItem);
      } else {
        if (!Array.isArray(template.menu.hidden)) template.menu.hidden = [];
        template.menu.hidden.push(cookiesPolicyPageMenuItem)
      }

      template.pages.push(cookiesPolicyPage.getId());

      // Need to implement in feature to seek element one time
      // new (sections)
      //    .setUpdater(new LinkUpdater(uniq options))
      //    .setUpdater(new EmbedBlockUpdater())
      //    .update();

      // update available Links and Anchors in sections:
      const sectionsData = sections.map(section => section.section);
      const createEmbedBlock = EmbedApiService.create.bind(null, userId);

      updateSectionsLinks(sectionsData, IdsMap);

      const headerIndex = sections.findIndex(section => section._id === template.header);
      const footerIndex = sections.findIndex(section => section._id === template.footer);

      sections[headerIndex]._id = newHeaderId;
      sections[headerIndex].section.options.hash = newHeaderId;
      sections[headerIndex].projectId = projectId;
      sections[footerIndex]._id = newFooterId;
      sections[footerIndex].section.options.hash = newFooterId;
      sections[footerIndex].projectId = projectId;

      template.header = newHeaderId;
      template.footer = newFooterId;

      return updateSectionsEmbedBlocks(sectionsData, pages, embedBlocks, projectId, createEmbedBlock)
        .then(
          () => Promise.all([
            saveProjectTemplatePages(projectId, pages.concat(cookiesPolicyPage).filter(projects => projects.projectId)),
            saveProjectTemplateSections(projectId, sections.concat(cookiesPolicyPageSections).filter(projects => projects.projectId)),
          ])
        ).then(() => [template, cookiesPolicyPage]);
    })
}

function prepareDomainName(email) {
  const nameParts = email
    .split('@')
    .shift()
    .split(/\W/);
  const ending = hasher.hash(email + Math.random()).slice(0, 5);

  const readyEmail = nameParts.reduce((prev, curr) => {
    if (Validation.isBadWord(prev)) {
      prev = prev[0] + hasher.hash(prev + Math.random()).slice(0, prev.length - 1);
    }
    return `${prev}-${curr}`;
  });

  return `${readyEmail}-${ending}`;
}

function generateDomain(data) {
  return new Promise((resolve, reject) => {
    const
      projectDomain = new ProjectDomain({
        name: data.name,
        project: data.projectId,
        userId: data.userId,
        isPrimary: true
      });

    projectDomain.verificationHash = hasher.hash(projectDomain._id + projectDomain.project + projectDomain.userId).slice(0, 16);

    projectDomain.save((error, result) => {
      if (error) {
        Project.findByIdAndRemove(data.projectId,
          () => logger.error('Removed project [' + data.projectId + '] document because of previous error'));

        return reject(error);
      }
      resolve({domainId: result._id, projectId: data.projectId});
    });
  });
}

function attachDomainToProject(domainId, projectId) {
  return new Promise((resolve, reject) => {
    Project.findByIdAndUpdate(
      projectId,
      {$push: {domains: domainId}},
      (error, project) => {
        if (error) {
          Project.findByIdAndRemove(projectId,
            () => logger.error('Removed project [' + projectId + '] document because of previous error'));
          ProjectDomain.findByIdAndRemove(domaintId,
            () => logger.error('Removed project domain [' + domainId + '] document because of previous error'));

          return reject(error);
        }

        resolve({domainId, projectId});
      });
  });
}

function attachProjectTemplateToProject(projectTemplateId, projectId) {
  return new Promise((resolve, reject) => {
    Project.findByIdAndUpdate(
      projectId,
      {
        projectTemplate: projectTemplateId
      },
      (error, result) => {
        if (error) {
          Project.findByIdAndRemove(projectId,
            () => logger.error(`Removed project [${ projectId }] document because of previous error`));
          ProjectDomain.findByIdAndRemove(domaintId,
            () => logger.error(`Removed project domain [${ projectId }] document because of previous error`));

          return reject(error);
        }

        resolve({projectTemplateId, projectId});
      });
  });
}

function createScreenshots(projectId, accessParams) {
  workersApi.copyScreenshots(projectId, accessParams)
    .catch(error => logger.error(error));
  // if (accessToken) {
  //   workersApi.copyScreenshots(projectId, accessToken)
  //     .catch(error => logger.error(error));
  // } else if (apiKey) {
  //   workersApi.partnerCopyScreenshots(projectId, apiKey)
  //     .catch(error => logger.error(error));
  // }
}

function isBackToTopActive(memberToken, userId) {
  return memberApi.account.getAccountPermission(memberToken, userId)
    .then(response => {
      let isActive = false;

      for (const rule of response.body.roles) {
        if (rule.permissions.find(e => e.name === 'backToTop')) {
          isActive = true;
        }
      }

      return isActive;
    })
}

function getCopyright(memberToken, userId) {
  return memberApi.account.getAccountPermission(memberToken, userId)
    .then(response => {

      if (response.body.settings.copyright) {
        return response.body.settings.copyright.value;
      }

      return "{}";
    });
}

function isAddressValid(payload) {
  return Promise.resolve(
    `${payload.businessAddress || ''}` ||
    `${payload.city || ''} ${payload.state || ''} ${payload.country || ''}`.trim().replace(/\s{2,}/g, ' ')
  );
  let objKey, count;
  return Keys
    .find({'date_expired': {$exists: false}})
    .sort({count: 1})
    .limit(1)
    .exec()
    .then(response => {
      if (!response || !response.length) {
        logger.error({message: 'Usable google keys is not exist'});
        return Promise.reject();
      }

      objKey = response[0];
      const key = objKey.key;
      const googleApi = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?';
      let callStack = [];

      count = objKey.count;

      const query = {
        input: `${payload.businessAddress} ${payload.city} ${payload.state} ${payload.country}`.trim().replace(/\s{2,}/g, ' '),
        key,
        language: 'en'
      };

      if (query.input.length === 0) {
        return Promise.reject();
      }

      const fullAddress = googleApi + querystring.stringify(query, '&', '=');

      callStack.push(fullAddress);
      count++;


      query.input = `${payload.city} ${payload.state} ${payload.country}`.trim().replace(/\s{2,}/g, ' ');
      const city = googleApi + querystring.stringify(query, '&', '=');
      if (query.input.length > 0) {
        callStack.push(city);
        count++;
      }

      query.input = `${payload.country}`.trim().replace(/\s{2,}/g, ' ');
      const country = googleApi + querystring.stringify(query, '&', '=');
      if (query.input.length > 0) {
        callStack.push(country);
        count++;
      }

      return Promise.all(callStack.map(addrUrl => request(addrUrl)));
    })
    .then(results => {
      if (['OVER_QUERY_LIMIT', 'REQUEST_DENIED'].includes(results[0].body.status)) {
        const date_expired = (new Date()).toISOString();
        Keys.updateOne({_id: objKey._id}, {$set: {count, date_expired}}).exec();
        logger.error({message: 'You have exceeded your daily request quota for Google map API'});
        return '';
      }

      for (let i = 0; i < results.length; i++) {
        if (results[i].body.predictions.length > 0) {
          return results[i].body.predictions[0].description
        }
      }
      return '';
    })
    .catch(error => {
      logger.error(error);
      return '';
    });
}

function filterSectionForDify(template, sections, dify) {
  if (!template.beforeCreate) return;

  const address = [
    dify.payload.businessAddress,
    dify.payload.city,
    dify.payload.state,
    dify.payload.postcode,
    dify.payload.country
  ].reduce((a, b) => b ? b : '', '');

  const mappedValues = {
    businessName: dify.payload.businessName,
    address: address,
    phone: dify.payload.phone || "",
    email: dify.payload.email || "",
    mapAddress: dify.payload.validMapAddress,
    copyright: dify.payload.copyright,
  };

  let arrayHandler = (hash, mappedValues, element, handlers) => {
    if (hash[0].handler === undefined) {
      if (mappedValues[hash[0].type]) {
        _.set(element, hash[0].prop, mappedValues[hash[0].type]);
      }
    }
    else {
      let action = handlers[hash[0].handler];
      if (typeof action === 'function') {
        element = action(element, mappedValues, hash[0].type);
      }
      else {
        _.set(element, hash[0].prop, mappedValues[hash[0].type]);
      }
    }
  };

  let findByHash = (beforeCreate, element) => {
    if (element.options !== undefined) {
      let hash;
      if (Array.isArray(element.options)) {
        element.options.map(option => {
          hash = beforeCreate.filter(beforeCreateElement => option.hash === beforeCreateElement.hash);
          if (hash.length > 0) {
            if (mappedValues[hash[0].type] !== "") {
              _.set(option, hash[0].prop.replace(/^options\./, ""), mappedValues[hash[0].type]);
            }
          }
        })
      }
      else {
        hash = beforeCreate.filter(beforeCreateElement => element.options.hash === beforeCreateElement.hash);
        if (hash.length > 0) {
          if (hash[0].values !== undefined) {
            hash[0].values.map(value => {
              arrayHandler([value], mappedValues, element, handlers);
            });
          }
          else {
            arrayHandler(hash, mappedValues, element, handlers);
          }
        }
      }
    }

    const isArray = Array.isArray(element.elements);

    if (isArray) {
      element.elements.map(el => {
        findByHash(beforeCreate, el);
      })
    }
  };

  sections.map(section => {
    findByHash(template.beforeCreate, section.section);
  });
}

function createProjectStickyElement(projectId) {
  const _id = uuid();
  return Promise.all([
    ProjectStickyElement.create({
      _id, projectId,
      elements: [{
        "name": "back_to_top",
        "options": {
          "hash": uuid(),
          "position": "right"
        }
      }]
    }),
    ProjectTemplate.updateOne({projectId}, {stickyElement: _id})
  ])
}

function isUserFromEU(req) {
  const isEu = _.get(req, 'account.user.isEu');

  if (typeof isEu === 'boolean') {
    return isEu;
  }

  // old solution: ---------------

  const userLocale = _.get(req, 'account.user.locale.code', 'en').toLowerCase();
  const countriesListEU = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
    'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB',
  ];
  const userFromEU = !!countriesListEU.find(i => i.toLowerCase() === userLocale);

  return userFromEU;
}

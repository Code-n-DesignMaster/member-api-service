'use strict';

const _ = require('lodash');
const uuid = require('uuid/v4');
const debug = require('debug')('app:controller:projects:clone');
const { NotAllowed, NotFound } = require('@sp/nodejs-utils').errors;

const config = require('../../config');
const logger = require('../../helpers/logger');
const copyIcons = require('../../helpers/copyIcons');
const request = require('../../utils/request');
const hasher = require('../../utils/hasher');

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const fileStorageService = apiComponent.getApi('fileStorageService');
const editorService = apiComponent.getApi('editor');

const { EcommerceApi, WorkersApi } = require('../../api');

const validation = require('@sp/nodejs-validation')({});

const { updateSectionsLinks } = require('./utils');

const models = require('@sp/mongoose-models');
const Project = models.Project;
const ProjectDomain = models.ProjectDomain;
const ProjectTemplateMenu = models.ProjectTemplateMenu;
const ProjectStickyElement = models.ProjectStickyElement;
const ProjectFile = models.ProjectFile;

const {
  OutOfPlanLimitSpecification,
  FreeDomainSpecification,
  AvailableStorageSpaceSpecification,
  AvailableFilesPerUserSpecification,
} = require('../../app/classes/specifications');

const projectLayer = new (require('../../app/serviceLayer/Project'))();

const {
  ProjectFileMapper,
  ProjectTemplateMapper,
  ProjectSettingsMapper,
  ProjectFaviconMapper,
  ProjectMapper,
  AccountsLimitsMapper,
  ProjectTemplateSectionMapper,
  ProjectTemplatePageMapper,
  ProjectEcommerceMapper,
} = require('../../app/classes/mappers');

module.exports = (req, res, next) => {
  debug('Start');

  let originProject;
  let filesStats;
  let newProject;

  const originProjectId = req.params.projectId;
  const newDomainName = prepareDomainName(req.user.email);

  const response = {};
  const newProjectId = uuid();
  const domainId = uuid();
  const projectTemplateId = uuid();

  const templateSectionsPromise = ProjectTemplateSectionMapper.many({
    projectId: originProjectId,
  }, 'section').then(r => r);

  return Promise
    .all([
      AccountsLimitsMapper.findById(req.userId),
      ProjectMapper.one({ _id: originProjectId, userId: req.userId }, '-_id userId name template eCommerce resellerId'),
      FreeDomainSpecification.isSatisfiedBy(newDomainName),
      ProjectMapper.count({ userId: req.userId, deleted: false }),
      ProjectFileMapper.getStorageInfo(req.userId),
      ProjectFileMapper.getFilesStats(originProjectId),
    ])
    .then(([accountLimits, project, isFreeDomainSatisfied, userProjectCount, storageInfo, filesStatsResult]) => {

      debug('AccountsLimitsMapper, ProjectMapper, FreeDomainSpecification, ProjectMapper.count, ProjectFileMapper.getStorageInfo, ProjectFileMapper.getFilesStats');
      originProject = project;
      filesStats = filesStatsResult;

      if (!originProject) return Promise.reject(new NotFound('PROJECT_NOT_FOUND'));
      if (!isFreeDomainSatisfied) return Promise.reject(new NotAllowed('NO_FREE_DOMAIN'));

      if (!AvailableStorageSpaceSpecification.isSatisfiedBy(storageInfo.used, filesStats.size, accountLimits.maxFileStorageSpace)) {
        return Promise.reject(new NotAllowed('CANT_CLONE_SPACE_LIMIT'));
      }

      if (!AvailableFilesPerUserSpecification.isSatisfiedBy(storageInfo.fileCount, filesStats.count, config.storage.maxFilesNumberPerUser)) {
        return Promise.reject(new NotAllowed('CANT_CLONE_FILES_LIMIT'));
      }

      return Promise.all([
        templateSectionsPromise,
        ProjectMapper.getProjectNextNum(req.userId, project.name),
        getSourceProjectEntities(originProjectId, req.memberApiAccessToken),
        OutOfPlanLimitSpecification.isSatisfiedBy(userProjectCount, accountLimits.outOfPlanLimit),
      ]);
    })
    .then(([projectSections, projectNextNum, projectEntities, outOfPlan]) => {

      debug('templateSectionsPromise, ProjectMapper.getProjectNextNum, getSourceProjectEntities, OutOfPlanLimitSpecification');
      const { projectSettings, projectTemplate, projectTemplatePages } = projectEntities;

      projectSettings.project = newProjectId;
      projectTemplate.projectId = newProjectId;
      projectTemplate._id = projectTemplateId;

      const callStack = [
        createProjectTemplateSections(projectTemplate, projectTemplatePages, projectSections, projectSettings),
        cloneStickyElement(projectTemplate, newProjectId),
        ProjectMapper.create({
          _id: newProjectId,
          userId: req.userId,
          template: originProject.template,
          name: originProject.name,
          num: projectNextNum,
          resellerId: originProject.resellerId,
          hasChangesAt: outOfPlan ? null : new Date(),
          projectTemplate: projectTemplateId,
          domains: [domainId],
        }),
        ProjectSettingsMapper.create(projectSettings),
        ProjectFaviconMapper.clone(originProjectId, newProjectId),
        generateDomain({
          _id: domainId,
          name: newDomainName,
          userId: req.userId,
          projectId: newProjectId,
        }),
        copyIcons(originProjectId, newProjectId, {accessToken: req.accessToken}),
      ];

      return Promise.all(callStack);
    })
    .then(([projectTemplate, stickyElement, project]) => {
      debug('createProjectTemplateSections, cloneStickyElement, ProjectSettingsMapper.create, ProjectFaviconMapper.clone, generateDomain');
      projectTemplate.stickyElement = stickyElement;

      return Promise.all([
        projectLayer.get(newProjectId, req.userId, originProjectId),
        ProjectEcommerceMapper.one({ projectId: originProjectId }),
        createMenu(newProjectId, projectTemplate),
        ProjectTemplateMapper.create(projectTemplate),
      ]);
    })
    .then(([response, projectEcommerce]) => {
      res.send(response);
      debug('Res.send on success after: projectLayer.get, ProjectEcommerceMapper, createMenu, ProjectTemplateMapper');

      const callStack = [
        FileStorageApi.copyProjectFiles(originProjectId, newProjectId, req.accessToken),
        memberApi.account.projectCreated(newProjectId, req.memberApiAccessToken),
        WorkersApi.copyScreenshotsFromProject(newProjectId, originProjectId, req.accessToken).catch(() => {}),
      ];

      if (filesStats.size && filesStats.count) {
        callStack.push(updateProjectFiles(originProjectId, newProjectId));
      }

      if (!_.isEmpty(originProject.eCommerce) || projectEcommerce) {
        callStack.push(editorService.ecommerce.clearEcommerceComponents(newProjectId, req.accessToken).catch(() => {}));
      }

      return Promise.all(callStack)
        .then(() => debug('Copy Project Files ends'));
    })
    .catch(next);
};

// -----------------
function getDebugWithIncrement() {
  let index = 0;
  let time;

  function debugWithIncrement(mess) {
    const currentDate = new Date();
    const duration = index === 0 ? '0.000' : Math.abs((currentDate - time)/1000).toString();
    time = currentDate;
    debug(`${index++} '${duration}'s -> ${mess}`);
  }

  return debugWithIncrement;
}

function getSourceProjectEntities(projectId) {
  return Promise
    .all([
      ProjectSettingsMapper.one({ project: projectId }, '-_id -project -pathToSvg'),
      ProjectTemplateMapper.populate({ projectId }, '-_id', ['menu', 'stickyElement']),
      ProjectTemplatePageMapper.many({ projectId }),
    ])
    .then(([projectSettings, projectTemplate, projectTemplatePages]) => {
      return {
        projectSettings,
        projectTemplate,
        projectTemplatePages,
      }
    });
}

function updateProjectFiles(projectId, newProjectId) {
  return ProjectFile
    .update(
      { project: projectId },
      {
        $push: {
          usedIn: newProjectId
        }
      },
      { multi: true }
    )
    .lean()
}



class FileStorageApi {
  static getUserInfo(accessToken) {
    return request(`${config.apiUrls.fileStorageService}/info`, {}, accessToken).then(r => r.body);
  }

  static copyProjectFiles(parentProjectId, projectId, accessToken) {
    return fileStorageService
      .storage
      .copyProjectFiles(parentProjectId, projectId, accessToken);
  }
}

function createProjectTemplateSections(projectTemplate, pages, sections, settings) {
  const { projectId } = projectTemplate;
  const newHeaderId = uuid();
  const newFooterId = uuid();

  const newProjectPages = [];
  const newProjectSections = [];
  const newProjectTemplate = Object.assign({}, projectTemplate, { pages: [] });

  const IdsMap = {
    pages: {},
    sections: {}
  };

  projectTemplate.pages.map(pageId => {

    const newPageId = uuid();
    const index = pages.findIndex(page => page._id === pageId);

    IdsMap.pages[pageId] = newPageId;

    if (index < 0) {
      return newPageId;
    }

    if (settings.notFoundPage.projectPageId === pageId) {
      settings.notFoundPage.projectPageId = newPageId;
    }

    updateProjectTemplateMenuElementHash(projectTemplate.menu.list, pageId, newPageId);
    updateProjectTemplateMenuElementHash(projectTemplate.menu.unlinked, pageId, newPageId);
    updateProjectTemplateMenuElementHash(projectTemplate.menu.hidden || [], pageId, newPageId);

    newProjectPages[index] = {
      _id: newPageId,
      projectId
    };

    newProjectPages[index].sections = pages[index].sections.map(sectionId => {

      const newSectionId = uuid();
      const index = sections.findIndex(section => section._id === sectionId);

      IdsMap.sections[sectionId] = newSectionId;

      sections[index]._id = newSectionId;
      sections[index].section.options.hash = newSectionId;
      sections[index].projectId = projectId;

      newProjectSections[index] = sections[index];

      return newSectionId;
    });

    newProjectTemplate.pages.push(newPageId);
  });

  // update available Anchors in sections:
  updateSectionsLinks(sections.map(section => section.section), IdsMap);

  const headerIndex = sections.findIndex(section => section._id === projectTemplate.header);
  const footerIndex = sections.findIndex(section => section._id === projectTemplate.footer);

  sections[headerIndex]._id = newHeaderId;
  sections[headerIndex].section.options.hash = newHeaderId;
  sections[headerIndex].projectId = projectId;
  sections[footerIndex]._id = newFooterId;
  sections[footerIndex].section.options.hash = newFooterId;
  sections[footerIndex].projectId = projectId;

  newProjectTemplate.header = sections[headerIndex]._id;
  newProjectTemplate.footer = sections[footerIndex]._id;
  newProjectSections.push(sections[headerIndex], sections[footerIndex]);

  const callStack = [
    ProjectTemplateSectionMapper.createMany(newProjectSections),
    ProjectTemplatePageMapper.createMany(newProjectPages),
  ];

  return Promise.all(callStack)
    .then(() => newProjectTemplate);
}

function createMenu(projectId, template) {
  const _id = uuid();
  const menu = {
    _id,
    projectId,
    list: template.menu.list,
    unlinked: template.menu.unlinked,
    hidden: template.menu.hidden || [],
  };

  template.menu = _id;

  return new Promise((resolve, reject) => {
    ProjectTemplateMenu.create(menu, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });
  });
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

function prepareDomainName(email) {
  const nameParts = email
    .split('@')
    .shift()
    .split(/\W/);
  const ending = hasher.hash(email + Math.random())
    .slice(0, 5);

  const readyEmail = nameParts.reduce((prev, curr) => {
    if (validation.isBadWord(prev)) {
      prev = prev[0] + hasher.hash(prev)
        .slice(0, prev.length - 1);
    }
    return `${prev}-${curr}`;
  });

  return `${readyEmail}-${ending}`;
}

function generateDomain(data) {
  return new Promise((resolve, reject) => {
    const
      projectDomain = new ProjectDomain({
        _id: data._id,
        name: data.name,
        project: data.projectId,
        userId: data.userId,
        isPrimary: true
      });

    projectDomain.verificationHash = hasher.hash(projectDomain._id + projectDomain.project + projectDomain.userId)
      .slice(0, 16);


    projectDomain.save((error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}

function cloneStickyElement(projectTemplate, projectId) {
  const _id = uuid();

  return ProjectStickyElement.create({
    _id,
    projectId,
    elements: projectTemplate.stickyElement ? projectTemplate.stickyElement.elements : []
  })
  .then(() => _id);
}

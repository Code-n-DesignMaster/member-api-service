'use strict';

const { DomainFormatter } = require('../../app/formatters');

const models = require('@sp/mongoose-models');
const Project = models.Project;
const ProjectSettings = models.ProjectSettings;
const ProjectDomain = models.ProjectDomain;
const Reseller = models.Reseller;

const { NotFound } = require('@sp/nodejs-utils').errors;

const getPublishedProjectsByUserId = require('../../helpers/getPublishedProjectsByUserId');

const debug = require('debug')('app:controller:Project:get');

module.exports = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.userId;
    const resellerId = req.user.reseller.resellerId;

    debug(`projectId:${projectId} userId:${userId} resellerId:${resellerId}`);

    const query = { _id: projectId, userId, deleted: false };
    const stats = await getAccountLimitStats(query, req.account.limits);
    const canPublish = stats.canPublish;
    const outOfPlan = stats.outOfPlan;

    const project = await getProject(query, resellerId, req.clonedFromProjectId);
    Object.assign(project, { outOfPlan, canPublish	});
    project.projectBgColor = await getBgs({project: query._id});

    const subscription = req.account.subscriptions[0];
    const publishPartnerDomainOnly = subscription.features.find((f) => (f.technicalName === 'publishPartnerDomainOnly' && f.featureValue === 'true'));

    if(publishPartnerDomainOnly) {
      project.domains = project.domains.filter((domain) => (domain.type !== 'free'));
    }

    res.send(project);
  } catch (err) {
    return next(err);
  }
};

function getAccountLimitStats(query, limits) {
  return new Promise((resolve, reject) => {
    const callStack = [
      isProjectOutOfPlan(query, limits.outOfPlanLimit),
      canProjectBePublished(query, limits)
    ];
    Promise
      .all(callStack)
      .then(results => {
        resolve({
          outOfPlan: results[0],
          canPublish: results[1]
        });
      })
      .catch(errors => reject(errors[0]));
  });
}

function isProjectOutOfPlan(query, outOfPlanLimit) {
  return new Promise((resolve, reject) => {
    const projectId = query._id;

    Project
      .find({
        userId: query.userId,
        deleted: false
      })
      .sort('createdAt')
      .limit(outOfPlanLimit)
      .select('_id')
      .lean()
      .exec((error, projects) => {
        if(error) {
          return reject(error);
        }

        resolve(!projects.find(project => project._id === projectId));
      });
  });
}

function canProjectBePublished(query, limits) {
  return new Promise((resolve, reject) => {
    getPublishedProjectsByUserId(query.userId)
      .then(projects => {
        resolve(projects.length < limits.maxAllowedSites);
      })
      .catch(error => {
        return reject(error);
      });
  });
}

function getProject(query, resellerId, clonedFromProjectId) {
  return new Promise((resolve, reject) => {
    ProjectDomain.find({
      $and: [
        {"userId": query.userId, deleted: {$ne: true}},
        {$or: [{"project": query._id}, {"project": {$exists: false}}]}
      ]
    })
      .lean()
      .exec((error, domains) => {
        if(error) {
          return reject(error);
        }

        Promise
          .all([
            Reseller.findOne({resellerId}).select('dynamicSubdomain settings.relay').lean(),
            Project.findOne(query).populate('template', 'title description src -_id').lean()
          ])
          .then(([resellerSettings, project]) => {
            if(!project) {
              return reject(new NotFound('PROJECT_NOT_FOUND'))
            }

            if (project.screenshotsDone) {
              project.previewImage = '/projects/' + project._id;
              project.template.src = '/projects/' + project._id;
            } else {
              project.previewImage = '/files/' +  project.template.src.name;
              project.template.src = '/files/' +  project.template.src.name;
            }

            project.ssl = false;
            project.domains = domains.map(d => DomainFormatter(d, resellerSettings)).filter(Boolean);

            // detecting primary domain and defining link
            let primaryDomain = project.domains.find(domain => (domain) ? domain.isPrimary : false);
            if(!primaryDomain) {
              primaryDomain = project.domains[0];
              if(project.domains[0]) {
                project.domains[0].isPrimary = true;
              }
            }
            if(primaryDomain) {
              project.link = primaryDomain.link;
              project.ssl = primaryDomain.ssl;
            }

            project.screenshotUrlTemplate = `/projects/${clonedFromProjectId || project._id}`;

            resolve(project);
          })
          .catch(reject)

      });
  });
}

function getBgs(query) {
  return new Promise((resolve, reject) => {
    ProjectSettings
      .findOne(query)
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

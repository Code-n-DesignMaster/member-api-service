'use strict';

const _ = require('lodash');
const logger = require('./logger');

const models = require('@sp/mongoose-models');
const Project = models.Project;

module.exports = (userId, accountLimits, options) => {
  let defaults = {inPlanOnly: false};
  let _options = _.defaults(options, defaults);

  return getProjectsByUserId(userId)
    .then((result) => {

      let isPublishedOutOfPlan = [];
      for (let i = 0; i < result.length; i++) {
        result[i].template = result[i].template[0];
        result[i].projectTemplate = result[i].projectTemplate[0];

        result[i].outOfPlan = !(i < accountLimits.outOfPlanLimit);

        if (result[i].publishedProject.length > 0) {
          result[i].publishedProject = result[i].publishedProject[0];

          if (!(result[i].publishedProject.mergedStatus === 'active' || result[i].publishedProject.mergedStatus === 'renewal_due')) {
            result[i].published = false;
          }

          if (result[i].outOfPlan && result[i].published) {
            isPublishedOutOfPlan.push(i);
          }
        }
      }

      if (isPublishedOutOfPlan.length > 0) {
        let tmp = {};
        for (let i = 0; i < isPublishedOutOfPlan.length; i++) {
          for (let j = result.length - 1; j >= 0; j--) {
            if (result[j].outOfPlan) {
              continue;
            }

            if (!result[j].published) {
              tmp = result[j];
              result[j] = result[isPublishedOutOfPlan[i]];
              result[j].outOfPlan = false;

              result[isPublishedOutOfPlan[i]] = tmp;
              result[isPublishedOutOfPlan[i]].outOfPlan = true;
              break;
            }
          }
        }
      }

      if (_options.inPlanOnly) {
        return result.filter(res => !res.outOfPlan);
      }

      if (accountLimits.outOfPlanLimit > 0) {
        let sortedRecentProjects = sortRecentProjects(result.splice(0, accountLimits.outOfPlanLimit));
        for (let i = 0; i < sortedRecentProjects.length; i++) {
          result.splice(i, 0, sortedRecentProjects[i]);
        }
      }
      return result;
    })
    .catch(error => {
      logger.error(error);
    });
};

function getProjectsByUserId(userId) {
  return Project.aggregate([
      {
        $match: {
          $and: [
            { userId: { $eq: userId } },
            { deleted: { $eq: false } }
          ]
        }
      },
      {
        $lookup: {
          from: "published_projects",
          localField: "_id",
          foreignField: "projectId",
          as: "publishedProject"
        }
      },
      // ----------------------
      // Fixed error: "Sort exceeded memory limit of 104857600 bytes"
      // just publishedProject.mergedStatus property used in publishedProject - remove excess props by $project
      {
        $project : {
          "_id" : 1,
          "updatedAt" : 1,
          "createdAt" : 1,
          "userId" : 1,
          "name" : 1,
          "template" : 1,
          "eCommerce" : 1,
          "screenshotsDone" : 1,
          "updatesCounter" : 1,
          "hasChangesAt" : 1,
          "deletedAt" : 1,
          "deleted" : 1,
          "publishedAt" : 1,
          "published" : 1,
          "hasChanges" : 1,
          "num" : 1,
          "domains" : 1,
          "projectTemplate" : 1,
          "firstPublishedAt" : 1,
          "resellerId" : 1,
          "publishedProject._id" : 1,
          "publishedProject.mergedStatus" : 1
        }
      },
      // ----------------------
    {
        $lookup: {
          from: "project_templates",
          localField: "projectTemplate",
          foreignField: "_id",
          as: "projectTemplate"
        }
      },
      {
        $lookup: {
          from: "template_versions",
          localField: "template",
          foreignField: "_id",
          as: "template"
        }
      },
      { $unwind: "$domains" },
      {
        $lookup: {
          from: "project_domains",
          localField: "domains",
          foreignField: "_id",
          as: "domainsObjects"
        }
      },
      { $unwind: "$domainsObjects" },
      {
        $group:
          {
            "_id": "$_id",
            "updatedAt": { $first: "$updatedAt"},
            "createdAt": { $first: "$createdAt"},
            "userId": { $first: "$userId"},
            "name": { $first: "$name"},
            "template": { $first: "$template"},
            "screenshotsDone": { $first: "$screenshotsDone"},
            "updatesCounter": { $first: "$updatesCounter"},
            "hasChangesAt": { $first: "$hasChangesAt"},
            "deletedAt": { $first: "$deletedAt"},
            "deleted": { $first: "$deleted"},
            "publishedAt": { $first: "$publishedAt"},
            "published": { $first: "$published"},
            "hasChanges": { $first: "$hasChanges"},
            "num": { $first: "$num"},
            "publishedProject": { $first: "$publishedProject" },
            "projectTemplate": { $first: "$projectTemplate" },
            "domains": { "$push": "$domainsObjects" },
            "eCommerce": { $first: "$eCommerce" },
          }
      },
      { $sort : { "createdAt": 1 } }
    ])
    // .allowDiskUse(true)
    ;
}

function sortRecentProjects(projects) {
  if (projects.length > 1) {
    projects.sort((a, b) => {
      const a_hasChangesAt = (a.hasChangesAt) ? new Date(a.hasChangesAt).getTime() : 0;
      const b_hasChangesAt = (b.hasChangesAt) ? new Date(b.hasChangesAt).getTime() : 0;
      const a_createdAt = (a.createdAt) ? new Date(a.createdAt).getTime() : 0;
      const b_createdAt = (b.createdAt) ? new Date(b.createdAt).getTime() : 0;
      if (a_hasChangesAt === b_hasChangesAt) {
        if (a_createdAt === b_createdAt) return 0;
        return (a_createdAt > b_createdAt) ? 1 : -1;
      }
      return (a_hasChangesAt > b_hasChangesAt) ? -1 : 1;
    });
  }
  return projects;
}

"use strict";

const models = require('@sp/mongoose-models');
const Project = models.Project;

module.exports = (userId) => {
  return getProjectsByUserId(userId)
    .then((result) => {
      let res = [];
      for(let i = 0; i<result.length; i++){
        if(result[i].publishedProject.length > 0){
          result[i].publishedProject = result[i].publishedProject[0];
        }
        if((result[i].publishedProject.mergedStatus === 'active' || result[i].publishedProject.mergedStatus === 'renewal_due') && result[i].published){
          res.push(result[i])
        }
      }

      return res;
    })
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
  ]);
}

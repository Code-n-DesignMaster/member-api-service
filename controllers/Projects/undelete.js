'use strict';

const logger = require('../../helpers/logger');
const responses = require('../../utils/responses');

const { NotAllowed, NotFound } = require('@sp/nodejs-utils').errors;
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const webHookApi = apiComponent.getApi('webHook');
const fileStorageService = apiComponent.getApi('fileStorageService');

const Validation = require('@sp/nodejs-validation')({});
const hasher = require('../../utils/hasher');

const models = require('@sp/mongoose-models');
const Project = models.Project;
const ProjectFile = models.ProjectFile;
const ProjectDomain = models.ProjectDomain;

const projectCreated = memberApi.account.projectCreated;

module.exports = (req, res, next) => {
  const userId = req.userId;
  const projectId = req.params.projectId;
  const userEmail = req.account.user.email;
  const resellerDomain = req.user.reseller.domain;

  Promise
    .all([
      fileStorageService.storage.remainingStorageSpace(req.accessToken),
      ProjectFile.find({ project: projectId }).select('size').lean()
    ])
    .then(([ remaining, files ]) => {
      const used = files.map(item => item.size).reduce((a, b) => a + b, 0);

      if(remaining < used) {
        return Promise.reject(new NotAllowed('LIMIT_OF_STORAGE_EXCEED'))
      }

      return Project.updateOne({ _id: projectId, userId }, {
        published: false,
        deleted: false,
        deletedAt: null,
        createdAt: new Date()
      })
    })
    .then(() => getFreeDomain(projectId, userId))
    .then(domain => generateNewNameForFreeDomain(domain, userEmail))
    .then((domainName) => {

      res.send({});

      // send event to webHook api ------------
      try {
        Project.findOne({_id: projectId})
          .lean()
          .then(doc => {
            const eventData = {
              type: 'project:created',
              payload: {
                memberId: userId,
                projectId: projectId,
                name: doc && doc.name || '',
                domain: `${domainName}.${resellerDomain}`
              }
            };

            webHookApi.sendEvent(eventData).then(response => {})
          })
      } catch(err) {
        console.log('WebHookApi Error:', err);
        logger.error(err);
      }

      projectCreated(projectId, req.memberApiAccessToken);
    })
    .catch(next);
};


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

function getFreeDomain (projectId, userId) {
  return new Promise((resolve, reject) => {
    const query = {
      project: projectId,
      userId: userId,
      type: 'free'
    };

    ProjectDomain
      .findOne(query)
      .exec((error, domain) => {
        if (error) {
          return reject(error);
        }

        if (!domain) {
          return reject(new NotFound('DOMAIN_NOT_FOUND'));
        }

        resolve(domain);
      })
  })
}

function generateNewNameForFreeDomain(domain, userEmail) {
  return new Promise((resolve, reject) => {
    const query = {
      _id: {'$ne': domain._id},
      $or: [{name: domain.name}, {newName: domain.name}]
    };

    ProjectDomain
      .findOne(query)
      .exec((error, sameDomain) => {
        if (error) {
          return reject(error);
        }

        if (!sameDomain) {
          return resolve(domain.name);
        }

        const newDomainName = prepareDomainName(userEmail);

        ProjectDomain
          .updateOne(
            {_id: domain._id},
            {name: newDomainName},
            (error) => {
              if (error) {
                return reject(error);
              }

              return resolve(newDomainName);
            }
          )
      })
  })
}



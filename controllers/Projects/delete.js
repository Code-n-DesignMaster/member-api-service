'use strict';

const _ = require('lodash');

const logger = require('../../helpers/logger');

const { NotFound } = require('@sp/nodejs-utils').errors;
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const webHookApi = apiComponent.getApi('webHook');

const models = require('@sp/mongoose-models');
const Project = models.Project;
const ProjectDomain = models.ProjectDomain;

const config = require('../../config');
const utilRequest = require('../../utils/request');

const ecommerceApiServiceV2 = require("../../api/EcommerceApiService/v2");
const { V2AccountSubscriptionsSpecification } = require('@sp/nodejs-utils/classes/specifications');

module.exports = (req, res, next) => {
  
  const userId = req.userId;
  const projectId = req.params.projectId;

  disconnectProjectDomains(projectId)
    .then(() => deleteUserProject(userId, projectId, req.accessToken, req))
    .then((projectDoc) => {

      // send event to webHook api ------------
      try {
        const projectDomain = projectDoc.domains.find(domain => domain.type === 'free');
        const eventData = {
          type: 'project:deleted',
          payload: {
            memberId: userId,
            projectId: projectId,
            name: projectDoc.name,
            domain: `${ projectDomain.name }.${ req.user.reseller.domain }`
          }
        };
        webHookApi.sendEvent(eventData).then(response => {});
      } catch (err) {
        console.log('WebHookApi Error:', err);
        logger.error(err);
      }

      res.send({});
      memberApi.account.projectDeleted(projectId, req.memberApiAccessToken);
    })
    .catch(next);
};

function deleteUserProject(userId, projectId, accessToken, req) {
  return new Promise((resolve, reject) => {
    Project
      .findOne({ _id: projectId })
      .populate('domains')
      .lean()
      .exec((error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(new NotFound('PROJECT_NOT_FOUND'));
        }

        if (V2AccountSubscriptionsSpecification.isSatisfiedBy(req.account)){
          ecommerceApiServiceV2.disconnectStore(projectId, req.accessToken).catch(logger.error);
        } else if (result.eCommerce !== undefined) {
          if (!_.isEmpty(result.eCommerce)) {
            utilRequest(
              `${config.apiUrls.ecommerceService}/${projectId}/project/connect`,
              { method: 'DELETE' },
              accessToken
            )
              .catch(error => {
                logger.error({
                  projectId,
                  message: 'Can not disconnect ecommerce',
                  projectEcommerce: result.eCommerce
                });
              });
          }
        }
        let domainsIdForDetach = result.domains.filter(domain => domain.type !== 'free').map(domain => domain._id);
        Project.updateOne(
          { _id: result._id },
          {
            $set: {
              deletedAt: Date.now(),
              deleted: true,
              published: false,
            },
            $pull: { domains: { $in: domainsIdForDetach } }
          },
          (error) => {
            if (error) {
              return reject(error);
            }

            resolve(result);
          });
      });
  });
}

function disconnectProjectDomains(projectId) {
  return new Promise((resolve, reject) => {
    ProjectDomain.updateMany(
      {
        project: projectId,
        type: { '$not': { $eq: 'free' } }
      },
      {
        $unset: { project: 1 },
        $set: { isPrimary: false }
      },
      (error) => {
        if (error) {
          return reject(error);
        }

        resolve();
      }
    );
  });
}

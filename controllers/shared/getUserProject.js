const models = require('@sp/mongoose-models');
const Project = models.Project;
const { NotFound } = require('@sp/nodejs-utils').errors;

module.exports = (userId, projectId) => {
  return new Promise((resolve, reject) => {
    Project
      .findOne({ _id: projectId, deleted: false, userId, })
      .populate('domains', '_id name type useWWW isPrimary isVerified verificationHash')
      .lean()
      .exec((error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(new NotFound('PROJECT_NOT_FOUND'))
        }

        resolve(result);
      });
  });
};

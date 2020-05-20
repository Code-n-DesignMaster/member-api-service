const models = require('@sp/mongoose-models');
const PublishedProject = models.PublishedProject;

module.exports = {
  findById(projectId, select) {
    return PublishedProject
      .findOne({ projectId })
      .select(select)
      .lean()
  },

}

const Mapper = require('./Mapper');
const { ProjectFavicon } = require('@sp/mongoose-models');

module.exports = new class ProjectFaviconMapper extends Mapper {
  constructor() {
    super(ProjectFavicon);
  }

  clone(projectId, newProjectId) {
    return ProjectFavicon
      .findOne({ projectId })
      .select('-_id -projectId')
      .lean()
      .then(doc => {
        if (!doc) return;

        doc.projectId = newProjectId;

        return ProjectFavicon.create(doc);
      });
  }
}

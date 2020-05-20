const { ProjectTemplatePage } = require('@sp/mongoose-models');

module.exports = class ProjectTemplatePageMapper {
  static many(query, select = '') {
    return ProjectTemplatePage
      .find(query)
      .select(select)
      .lean();
  }

  static createMany(pages) {
    return ProjectTemplatePage.insertMany(pages);
  }
};

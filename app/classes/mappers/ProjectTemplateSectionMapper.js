const { ProjectTemplateSection } = require('@sp/mongoose-models');

module.exports = class ProjectTemplateSectionMapper {
  static many(query, select = '') {
    return ProjectTemplateSection
      .find(query)
      .select(select)
      .lean();
  }

  static createMany(sections) {
    return ProjectTemplateSection.insertMany(sections);
  }
};

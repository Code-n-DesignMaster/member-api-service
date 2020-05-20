const Mapper = require('./Mapper');
const { ProjectTemplate } = require('@sp/mongoose-models');

module.exports = new class ProjectTemplateMapper extends Mapper {
  constructor() {
    super(ProjectTemplate);
  }
};

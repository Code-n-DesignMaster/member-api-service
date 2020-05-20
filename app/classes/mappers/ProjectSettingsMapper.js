const Mapper = require('./Mapper');
const { ProjectSettings } = require('@sp/mongoose-models');

module.exports = new class ProjectSettingsMapper extends Mapper {
  constructor() {
    super(ProjectSettings);
  }
};

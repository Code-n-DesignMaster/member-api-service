const Mapper = require('./Mapper');
const { ProjectDomain } = require('@sp/mongoose-models');

module.exports = new class ProjectDomainMapper extends Mapper {
  constructor() {
    super(ProjectDomain);
  }
}

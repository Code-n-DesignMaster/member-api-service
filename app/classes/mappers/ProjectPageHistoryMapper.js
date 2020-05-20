const Mapper = require('./Mapper');
const { ProjectPageHistory } = require('@sp/mongoose-models');

module.exports = new class ProjectPageHistoryMapper extends Mapper {
  constructor() {
    super(ProjectPageHistory);
  }
};

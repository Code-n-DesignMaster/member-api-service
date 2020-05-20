const Mapper = require('./Mapper');
const { PublishedProject } = require('@sp/mongoose-models');

module.exports = new class PublishedProjectMapper extends Mapper {
  constructor() {
    super(PublishedProject);
  }
};


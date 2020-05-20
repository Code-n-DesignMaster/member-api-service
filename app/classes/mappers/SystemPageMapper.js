const Mapper = require('./Mapper');
const { SystemPage } = require('@sp/mongoose-models');
const { SystemPageModel, SystemSectionModel } = require('../models');

module.exports = new class SystemPageMapper extends Mapper {
  constructor() {
    super(SystemPage, SystemPageModel);
  }

  populate(query) {
    const schema = this.collection.findOne(query);

    return schema.populate('sections').lean()
      .then(doc => new SystemPageModel(doc).setSections(doc.sections.map(s => new SystemSectionModel(s))));
  }
}

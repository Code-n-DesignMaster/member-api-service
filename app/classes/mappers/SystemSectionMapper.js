const Mapper = require('./Mapper');
const { SystemSection } = require('@sp/mongoose-models');
const { SystemSectionModel } = require('../models');

module.exports = new class SystemSectionMapper extends Mapper {
  constructor() {
    super(SystemSection, SystemSectionModel);
  }
}

const Mapper = require('./Mapper');
const { TemplateVersion } = require('@sp/mongoose-models');

module.exports = new class TemplateMapper extends Mapper {
  constructor() {
    super(TemplateVersion);
  }
}

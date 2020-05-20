const Mapper = require('./Mapper');
const { TemplateV2 } = require('@sp/mongoose-models');
const TemplateV2Model = require('../models/TemplateV2Model');

module.exports = new class TemplateV2Mapper extends Mapper {
  constructor() {
    super(TemplateV2, TemplateV2Model);
  }
};

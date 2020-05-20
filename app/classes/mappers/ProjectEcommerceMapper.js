const Mapper = require('./Mapper');
const { ProjectEcommerce } = require('@sp/mongoose-models');
const { ProjectEcommerceModel } = require('@sp/nodejs-utils/classes/models');

module.exports = new class ProjectEcommerceMapper extends Mapper {
  constructor() {
    super(ProjectEcommerce, ProjectEcommerceModel);
  }
}

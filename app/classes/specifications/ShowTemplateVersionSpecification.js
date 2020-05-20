const config = require('../../../config');

module.exports = class ShowTemplateVersionSpecification {
  static isSatisfiedBy(template, isShowEcommerceTemplate) {
    if (template.hidden) return false;
    if (template.versionName === config.ecommerceVersionName && !isShowEcommerceTemplate) return false;

    return true;
  }
}

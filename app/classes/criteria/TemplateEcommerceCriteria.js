const config = require('../../../config');

module.exports = class EcommerceCriteria {
  constructor(isShow) {
    this.isShow = isShow;
  }

  filter(templates) {
    if (this.isShow) return templates;

    return templates.filter(template => {
      template.versions = template.versions.filter(version => version.versionName !== config.ecommerceVersionName);

      return template.versions.length;
    });
  }
};

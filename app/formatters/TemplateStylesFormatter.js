const { templateUrlSuffix } = require('../../config');

module.exports = class TemplateV2Formatter {
  constructor(template) {
    this.template = template;
  }

  format() {
    const versions = this.template.getVersions();
    const primary = versions[0];

    return {
      title: this.template.getTitle(),
      styles: primary.styles || {},
    };
  }
};

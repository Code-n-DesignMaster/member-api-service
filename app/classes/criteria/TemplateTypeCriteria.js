module.exports = class TypeCriteria {
  constructor(types) {
    this.types = types;
  }

  filter(templates) {
    return templates.filter(template => {
      template.versions = template.versions.filter(version => this.types.includes(version.versionName));

      return template.versions.length;
    });
  }
};

module.exports = class LocaleCriteria {
  constructor(locale) {
    this.locale = locale;
  }

  filter(templates) {
    return templates.filter(template => {
      template.versions = template.versions.filter(version => {

        if(version.locale) {
          return version.locale.some(l => this.locale.includes(l));
        }
      });

      return template.versions.length;
    });
  }
};

const { templateUrlSuffix } = require('../../config');

module.exports = class TemplateV2Formatter {
  constructor(template) {
    this.template = template;
  }

  format(locales, types) {
    const versions = this.template.getVersions();

    const formatedVersions = versions
      .sort((a, b) => {
        return types.indexOf(a.versionName) - types.indexOf(b.versionName);
      })
      .map(version => {
        return {
          _id: version._id,
          name: version.link,
          versionName: version.versionName,
          title: version.title,
          description: version.description,
          templateIndex: version.templateIndex,
          type: version.type,
          hidden: version.hidden,
          link: `${version.link}.${templateUrlSuffix}`,
          src: version.src,
          locale: version.locale
        };
      });

    const primary = formatedVersions[0];

    return {
      _id: this.template.getId(),
      templateIndex: this.template.getTemplateIndex(),
      title: this.template.getTitle(),
      description: this.template.getDescription(),
      src: primary.src,
      primaryVersion: this.template.getPrimaryVersion(),
      hidden: this.template.getHidden(),
      deleted: this.template.getDeleted(),
      position: this.template.getPosition(),
      categories: this.template.getCategories().map(c => c.name),
      versions: formatedVersions,
    };
  }
};

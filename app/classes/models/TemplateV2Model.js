module.exports = class TemplateV2 {
  constructor(template) {
    Object.assign(this, template);
  }

  getId() {
    return this._id;
  }

  setId(value) {
    this._id = value;
    return this;
  }

  getTemplateIndex() {
    return this.templateIndex;
  }

  setTemplateIndex(value) {
    this.templateIndex = value;
    return this;
  }

  getTitle() {
    return this.title;
  }

  setTitle(value) {
    this.title = value;
    return this;
  }

  getDescription() {
    return this.description;
  }

  setDescription(value) {
    this.description = value;
    return this;
  }

  getSrc() {
    return this.src;
  }

  setSrc(value) {
    this.src = value;
    return this;
  }

  getPrimaryVersion() {
    return this.primaryVersion;
  }

  setPrimaryVersion(value) {
    this.primaryVersion = value;
    return this;
  }

  getHidden() {
    return this.hidden;
  }

  setHidden(value) {
    this.hidden = value;
    return this;
  }

  getDeleted() {
    return this.deleted;
  }

  setDeleted(value) {
    this.deleted = value;
    return this;
  }

  getPosition() {
    return this.position;
  }

  setPosition(value) {
    this.position = value;
    return this;
  }

  getVersions() {
    return this.versions;
  }

  setVersions(value) {
    this.versions = value;
    return this;
  }

  getCategories() {
    return this.categories;
  }

  setCategories(value) {
    this.categories = value;
    return this;
  }
};

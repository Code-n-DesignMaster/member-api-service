module.exports = class ProjectTemplatePage {
  constructor(page) {
    Object.assign(this, page);
  }

  getId() {
    return this._id;
  }

  setId(value) {
    this._id = value;
    return this;

  }
  getSections() {
    return this.sections;
  }

  setSections(value) {
    this.sections = value;
    return this;
  }

  getProjectId() {
    return this.projectId;
  }

  setProjectId(value) {
    this.projectId = value;
    return this;
  }
};

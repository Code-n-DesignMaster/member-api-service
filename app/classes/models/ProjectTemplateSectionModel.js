module.exports = class ProjectTemplateSectionModel {
  constructor(data) {
    Object.assign(this, data);

    if (!this.section) {
      this.section = {};
    }
  }

  getId() {
    return this._id;
  }

  setId(value) {
    this._id = value;
    return this;
  }

  getProjectId() {
    return this.projectId;
  }

  setProjectId(value) {
    this.projectId = value;
    return this;
  }

  getName() {
    return this.section.name;
  }

  setName(value) {
    this.section.name = value;
    return this;
  }

  getType() {
    return this.section.type;
  }

  setType(value) {
    this.section.type = value;
    return this;
  }

  getElements() {
    return this.section.elements;
  }

  setElements(value) {
    this.section.elements = value;
    return this;
  }

  getOptions() {
    return this.section.options;
  }

  setOptions(value) {
    this.section.options = value;
    this.section.options.hash = this.getId();
    return this;
  }
}

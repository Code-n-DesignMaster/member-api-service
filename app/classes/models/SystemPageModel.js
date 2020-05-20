module.exports = class SystemPage {
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

  getName() {
    return this.name;
  }

  setName(value) {
    this.name = value;
    return this;
  }
};

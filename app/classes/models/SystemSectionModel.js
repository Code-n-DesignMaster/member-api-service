module.exports = class SystemSection {
  constructor(data) {
    Object.assign(this, data);
  }

  getId() {
    return this._id;
  }

  setId(value) {
    this._id = value;
    return this;

  }

  getName() {
    return this.name;
  }

  setName(value) {
    this.name = value;
    return this;
  }

  getType() {
    return this.type;
  }

  setType(value) {
    this.type = value;
    return this;
  }

  getElements() {
    return this.elements;
  }

  setElements(value) {
    this.elements = value;
    return this;
  }

  getOptions() {
    return this.options;
  }

  setOptions(value) {
    this.options = value;
    return this;
  }
}

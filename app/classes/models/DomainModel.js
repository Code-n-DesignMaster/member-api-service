module.exports = class DomainModel {
  constructor(domain) { 
    Object.assign(this, domain);
  }

  getId() {
    return this._id;
  }

  getName() {
    return this.name;
  }

  getNewName() {
    return this.newName;
  }

  getProjectId() {
    return this.projectId;
  }

  getType() {
    return this.type;
  }

  isPrimary() {
    return this.isPrimary;
  }

  isSsl() {
    return this.ssl;
  }

}

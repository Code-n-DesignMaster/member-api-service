module.exports = class MenuItemModel {
  constructor(data) {
    Object.assign(this, data);

    if (!this.children) {
      this.children = [];
    }
  }

  getName() {
    return this.name;
  }

  setName(value) {
    this.name = value;
    return this;
  }
  getHash() {
    return this.hash;
  }

  setHash(value) {
    this.hash = value;
    return this;
  }

  getTitle() {
    return this.title;
  }

  setTitle(value) {
    this.title = value;
    return this;
  }

  getOgTitle() {
    return this.ogTitle;
  }

  setOgTitle(value) {
    this.ogTitle = value;
    return this;
  }

  getDescription() {
    return this.description;
  }

  setDescription(value) {
    this.description = value;
    return this;
  }

  getOgDescription() {
    return this.ogDescription;
  }

  setOgDescription(value) {
    this.ogDescription = value;
    return this;
  }

  getUrl() {
    return this.url;
  }

  setUrl(value) {
    this.url = value;
    return this;
  }

  getIsOpenNew() {
    return this.isOpenNew;
  }

  setIsOpenNew(value) {
    this.isOpenNew = value;
    return this;
  }

  getTag() {
    return this.tag;
  }

  setTag(value) {
    this.tag = value;
    return this;
  }

  getType() {
    return this.type;
  }

  setType(value) {
    this.type = value;
    return this;
  }

  getHomepage() {
    return this.homepage;
  }

  setHomepage(value) {
    this.homepage = value;
    return this;
  }

  getChildren() {
    return this.children;
  }

  setChildren(value) {
    this.children = value;
    return this;
  }

  getEcommerce() {
    return this.ecommerce;
  }

  setEcommerce(value) {
    this.ecommerce = value;
    return this;
  }

  getBlog() {
    return this.blog;
  }

  setBlog(value) {
    this.blog = value;
    return this;
  }

  getIsSystem() {
    return this.isSystem;
  }

  setIsSystem(status = false) {
    this.isSystem = status;
    return this;
  }
}

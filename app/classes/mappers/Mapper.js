module.exports = class Mapper {
  constructor(collection, model) {
    this.collection = collection;
    this.model = model;
  }

  findById(_id, select = '') {
    return this.collection
      .findOne({ _id })
      .select(select)
      .lean()
      .then(doc => this.model && doc ? new this.model(doc) : doc);
  }

  create(project) {
    return this.collection.create(project)
  }

  count(query) {
    return this.collection
      .count(query)
      .lean();
  }

  updateOne(query, updates, options) {
    return this.collection.updateOne(query, updates, options);
  }

  remove(query) {
    return this.collection.find(query).remove();
  }

  one(query, select = '') {
    return this.collection
      .findOne(query)
      .select(select)
      .lean()
      .then(doc => this.model && doc ? new this.model(doc) : doc);
  }

  populateMany(query, fields = [], sort = {}) {
    const schema = this.collection.find(query);

    for (const field of fields) {
      schema.populate(field);
    }

    return schema.sort(sort).lean()
      .then(docs => this.model ? docs.map(d => new this.model(d)) : docs);
  }
  
  populate(query, select, fields = []) {
    const schema = this.collection.findOne(query);

    for (const field of fields) {
      schema.populate(field);
    }

    return schema.select(select).lean()
      .then(doc => this.model ? new this.model(doc) : doc);
  }
};

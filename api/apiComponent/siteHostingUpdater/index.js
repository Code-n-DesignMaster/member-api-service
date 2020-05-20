module.exports = (components) => {
  return {
    publish: require('./publish')(components),
    unpublish: require('./unpublish')(components),
  }
};

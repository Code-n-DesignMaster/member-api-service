module.exports = class Filter {
  constructor(data) {
    this.data = data;
    this.criteria = [];
  }

  addFilter(filter) {
    this.criteria.push(filter);
  }

  filter() {
    let result = this.data;

    this.criteria.forEach(c => {
      result = c.filter(result);
    });

    return result;
  }
}

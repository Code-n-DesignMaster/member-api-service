const { ProjectDomainMapper, ProjectTemplateMapper } = require('../mappers');

module.exports = class AndSpecification {
  constructor(A, B) {
    this.A = A;
    this.B = B;
  }

  isSatisfiedBy(...args) {
    return this.A.isSatisfiedBy(...args) && this.B.isSatisfiedBy(...args);
  }
}

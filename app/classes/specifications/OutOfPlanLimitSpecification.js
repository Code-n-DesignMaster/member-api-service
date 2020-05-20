module.exports = class OutOfPlanLimitSpecification {
  static isSatisfiedBy(projectsCount, limit) {
    return projectsCount >= limit;
  }
};

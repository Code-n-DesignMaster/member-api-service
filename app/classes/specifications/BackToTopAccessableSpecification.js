module.exports = class BackToTopAccessableSpecification {
  static isSatisfiedBy(permissions) {
    let isActive = false;

    for (const rule of permissions.roles) {
      if (rule.permissions.find(p => p.name === 'backToTop')) {
        isActive = true;
      }
    }

    return isActive;
  }
}

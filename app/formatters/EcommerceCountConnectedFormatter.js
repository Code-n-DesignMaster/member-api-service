const { PausedEcommerceFeatureSpecification } = require('../classes/specifications/');

module.exports = class {
  constructor(projectEcommerces, subscription, projectId) {
    this.projectEcommerces = projectEcommerces;
    this.subscription = subscription;
    this.projectId = projectId;
  }

  format() {
    const total = this.subscription.getStoreLimit();
    const currentEcommerce = this.projectEcommerces.find(e => e.projectId === this.projectId);

    if (PausedEcommerceFeatureSpecification.isSatisfiedBy(this.subscription) && !currentEcommerce) {
      return {
        active: this.projectEcommerces.length,
        total,
      };
    }

    return {
      active: this.projectEcommerces.filter(e => e.status === 'active').length,
      total,
    };
  }
};

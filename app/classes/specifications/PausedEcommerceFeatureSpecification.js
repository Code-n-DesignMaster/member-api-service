module.exports = class PausedEcommerceFeatureSpecification {
  static isSatisfiedBy(subscription) {
    const feature = subscription.features.find(f => f.technicalName === 'ecommerceLockType');

    if (feature && feature.featureValue === 'paused') {
      return true;
    }

    return false;
  }
}

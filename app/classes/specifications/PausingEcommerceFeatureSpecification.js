module.exports = class PausedEcommerceFeatureSpecification {
  static isSatisfiedBy(prevSub, nextSub) {
    const prevFeatureState = prevSub.features.find(f => f.technicalName === 'ecommerceLockType');
    const nextFeatureState = nextSub.features.find(f => f.technicalName === 'ecommerceLockType');

    if (prevFeatureState.featureValue === 'active' && nextFeatureState.featureValue === 'paused') {
      return true;
    }
  }
}

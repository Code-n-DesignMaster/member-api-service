module.exports = class HasEcommerceLockTypeSpecification {
  static isSatisfiedBy(prevSub, nextSub) {
    const prevFeatureState = prevSub.features.find(f => f.technicalName === 'ecommerceLockType');
    const nextFeatureState = nextSub.features.find(f => f.technicalName === 'ecommerceLockType');

    if (!prevFeatureState || !nextFeatureState) return false;

    return true;
  }
}

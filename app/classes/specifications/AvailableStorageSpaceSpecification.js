module.exports = class AvailableStorageSpaceSpecification {
  static isSatisfiedBy(spaceUsed, potentialSpace, limit) {
    if ((spaceUsed + potentialSpace) > limit) return false;

    return true;
  }
}

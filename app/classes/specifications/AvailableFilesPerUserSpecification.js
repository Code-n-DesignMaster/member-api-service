module.exports = class AvailableFilesPerUserSpecification {
  static isSatisfiedBy(fileCountUsed, potentialFiles, limit) {
    if ((fileCountUsed + potentialFiles) > limit) return false;

    return true;
  }
};

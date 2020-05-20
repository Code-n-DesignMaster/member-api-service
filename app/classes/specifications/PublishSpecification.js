module.exports = class PublishSpecification {
  static isSatisfiedBy(project, publishedProject, publishedCount, maxAllowedSitesCount) {
    const isPublished = publishedProject && project.published === true;

    if (isPublished && ['active', 'renewal_due', 'pending'].includes(publishedProject.mergedStatus)) {
      return true;
    }

    if (publishedCount >= maxAllowedSitesCount) {
      return false;
    }

    return true;
  }
}

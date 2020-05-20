const { ProjectDomainMapper, ProjectTemplateMapper } = require('../mappers');

module.exports = class FreeDomainSpecification {
  static isSatisfiedBy(domainName) {
    return Promise
      .all([
        ProjectDomainMapper.count({
          $or: [
            { name: domainName },
            { newName: domainName },
          ],
        }),
        // ProjectTemplateMapper.count({
        //   link: domainName,
        // }),
      ])
      .then(domains => domains.every(d => d === 0));
  }
};

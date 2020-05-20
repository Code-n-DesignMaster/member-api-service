const DomainModel = require('../classes/models/DomainModel');

module.exports = class DomainFactory {
  static createPublishDomain(domains, domainId) {
    if(domainId) {
      return new DomainModel(domains.find(domain => domain._id === domainId));
    } else {
      return new DomainModel(domains[0]);
    }
  }
}

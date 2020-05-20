'use strict';

const _ = require('lodash');

/**
 * Format domain object for response
 * @param {object} domain - Domain object
 * @param {object} resellerSettings - Reseller Settings
 * @param {string} resellerSettings.dynamicSubdomain - reseller dynamicSubdomain.
 * @param {object} resellerSettings.settings - reseller settings object
 * @return {object} Formatted domain object.
 */
module.exports = (domain, resellerSettings) => {
  if (domain.type === 'custom' && !domain.isVerified) return null;

  const isFreeDomain = domain.type === 'free';
  const freeDomainSsl = _.get(resellerSettings, 'settings.relay.freeDomainSsl', null);

  const domainName = domain.newName !== null ? domain.newName : domain.name;
  let link = domainName.trim();
  let ssl = domain.ssl;

  if (isFreeDomain) {
    link = `${domainName.trim()}.${resellerSettings.dynamicSubdomain}`;
    ssl = (freeDomainSsl === 'true');
  }
  return {
    project: domain.project,
    verificationAttempt: domain.verificationAttempt,
    isVerified: domain.isVerified,
    isPrimary: domain.isPrimary,
    userId: domain.userId,
    userWWW: domain.userWWW,
    type: domain.type,
    name: domainName,
    domainId: domain._id,
    link, ssl,
  }
};

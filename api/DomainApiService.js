'use strict';

const { Request } = require('@sp/nodejs-utils').classes;
const config = require('../config');

const request = new Request(config.apiUrls.domainService).freezy();

module.exports = {
  setPrimaryDomain(projectId, domainId, body, accessToken) {
    return request.exec({
      endpoint: `/projects/${projectId}/domains/${domainId}/primary`,
      bearer: accessToken,
      method: 'PUT',
      body,
    }).then(r => r.body);
  },

  setPrimaryDomainByApiKey(projectId, domainId, body, userId, apiKey) {
    return request.exec({
      endpoint: `/api-projects/${projectId}/domains/${domainId}/primary?userId=${userId}`,
      method: 'PUT',
      body, apiKey,
    }).then(r => r.body);
  },

  deletePartnerDomain(partnerDomainId, apiKey) {
    return request.exec({
      endpoint: `/partner-domain/${partnerDomainId}?apiKey=${apiKey}`,
      method: 'DELETE'
    }).then(r => r.body);
  }

};

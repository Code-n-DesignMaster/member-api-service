'use strict';

const logger = require('../../../helpers/logger');
const config = require('../../../config');
const servicesApiKey = config.apiKeys.servicesApiKey;

const domainApi = require('../../../api').DomainApi;

const debug = require('debug')('app:controller:Events:Domain');

module.exports = class {
  constructor(userId, status, payload) {
    this.userId = userId;
    this.status = status;
    this.payload = payload;
    this.domainId = payload.domainId;
  }

  process() {

    debug(`Status: ${this.status}`);
    debug(`Payload`, this.payload);

    const requiredFields = [
      'domainId',
    ];

    for (let i = 0; i < requiredFields.length; i++) {
      let field = requiredFields[i];
      if (this.payload[field] === undefined) {
        return Promise.reject({
          "type": "validation",
          "messages": [
            {
              "field": `${field}`,
              "messages": `${field} is required`
            }
          ]
        })
      }
    }

    return this[this.status](this.domainId)
      .then(() => {
        return Promise.resolve({});
      })
      .catch((err) => {
        logger.error(err);
        return Promise.reject(err);
      })
  }

  deleted(domainId) {
    return domainApi.deletePartnerDomain(domainId, servicesApiKey);
  }

};

'use strict';

const request = require('../../utils/request');
const config = require('../../config');

const memberApiUrl = config.apiUrls.member;
const memberApiKey = config.apiKeys.memberApi;

module.exports = {
  getResellerCred(resellerId, credType, vendor) {
    return request(`${ memberApiUrl }/reseller/${ resellerId }/credential/${ credType }/${ vendor }?apiKey=${ memberApiKey }`, {
      method: "GET",
      json: true
    });
  },

  getLegalStatements(resellerId) {
    return this.getResellerSettingCategory(resellerId, 'legalStatements')
      .then(response => {
        const result = {};

        for(const setting of response.body.settings) {
          result[setting.settingTechnicalName] = setting.value;
        }

        return result;
      })
  },

  getResellerSettingCategory(resellerId, category) {
    return request(`${ memberApiUrl }/reseller/${ resellerId }/setting/category/${ category }?apiKey=${ memberApiKey }`);
  }
};

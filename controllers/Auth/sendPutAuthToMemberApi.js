'use strict';

const logger = require('../../helpers/logger');
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

module.exports = (req, res, next) => {
  memberApi.auth.sendPutAuthToMemberApi({}, req.memberApiAccessToken)
    .catch(next);
};

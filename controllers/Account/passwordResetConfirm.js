'use strict';

const logger = require('../../helpers/logger');
const responses = require('../../utils/responses');
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const Validation = require('@sp/nodejs-validation')({});

const models = require('@sp/mongoose-models');
const AccessToken = models.AccessToken;

module.exports = (req, res, next) => {
  const isWeakPassword = Validation.isWeakPassword('password', req.body.password);

  if (isWeakPassword) {
    return responses.onValidation(isWeakPassword, res);
  }

  memberApi.account.passwordResetConfirm(req.body, true)
    .then(result => {
      let response = result.body;

      const userId = result.body.memberId;
      const memberApiAccessToken = result.body.accessToken;

      AccessToken.remove({ userId }, error => {
        if (error) return Promise.reject(error);
      });

      return memberApi.account.getAccountInfo(memberApiAccessToken)
        .then((account) => {
          const data = {
            memberApiAccessToken,
            userId: account.body.id,
            user: account.body,
            ipAddress: req.ip || '127.0.0.1',
          };

          AccessToken.create(data, (error, newAccessToken) => {
            if (error) logger.error(error);

            const accessToken = _.get(newAccessToken, '_id');
            response.accessToken = accessToken;

            res.cookie('accessToken', accessToken, { maxAge: 3600000 });
            res.status(200).send(response);
          });
        })
    })
    .catch(error => {
      next(error);
    });
};

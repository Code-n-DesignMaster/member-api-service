'use strict';

const co = require('co');
const _ = require('lodash');

const logger = require('../../helpers/logger');
const responses = require('../../utils/responses');
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

const models = require('@sp/mongoose-models');
const AccessToken = models.AccessToken;

const getAccountInfo = memberApiAccessToken => {
  return memberApi.account.getAccountInfo(memberApiAccessToken);
};

const updateAccountEmail = (newEmail, currentEmail, memberApiAccessToken) => {
  return new Promise((resolve, reject) => {
    memberApi
      .account
      .updateAccountEmail({
        email: currentEmail,
        newEmail
      }, memberApiAccessToken)
      .then(resolve)
      .catch(error => {
        if (error.body.type === 'validation') {
          error.body.messages.map(message => {
            if (message.field === 'newEmail') {
              message.field = 'email';
            }
          });
        }
        reject(error);
      });
  });
};

const updateAccountContact = (contact, memberApiAccessToken) => {
  return memberApi.account.updateAccountContact(contact, memberApiAccessToken);
};
const updateAccountNotificationSettings = (notificationSettings, memberApiAccessToken) => {
  return memberApi.account.updateAccountNotificationSettings(notificationSettings, memberApiAccessToken);
};
const updateAccountInfo = (accountInfo, memberApiAccessToken) => {
  return memberApi.account.updateAccountInfo(accountInfo, memberApiAccessToken);
};
const adapt = data => {
  if (!data.hasOwnProperty('emailContentType')) return data;

  switch (data.emailContentType.toString()
    .toLowerCase()) {
    case 'html' :
    case 'plain' :
      break;
    case '0' :
      data.emailContentType = 'html';
      break;
    case '1' :
      data.emailContentType = 'plain';
      break;
    default :
      delete data.emailContentType;
  }

  return data;
};

function* update(data, current, memberApiAccessToken) {
  const
    accountInfo = _.omit(data, ['contact', 'notifications', 'plan', 'email']),
    { contact, notifications, email } = data;

  return yield [
    email && updateAccountEmail(email, current.email, memberApiAccessToken),
    contact && updateAccountContact(contact, memberApiAccessToken),
    notifications && updateAccountNotificationSettings(notifications, memberApiAccessToken),
    accountInfo && updateAccountInfo(accountInfo, memberApiAccessToken)
  ];
}

module.exports = (req, res, next) => {
  co(function* () {
    const currentInfo = yield getAccountInfo(req.memberApiAccessToken);
    const res = yield* update(adapt(req.body), currentInfo.body, req.memberApiAccessToken);
    return {};
  })
    .then(result => {
      if (req.body.language || req.body.language === 0) {
        return AccessToken.findByIdAndUpdate(req.accessToken, {$set: {'user.language': req.body.language}}, {})
          .then(() => {
            responses.onSuccess(res, result);
          }).catch(() => {
            responses.onSuccess(res, result);
          })
      }

      return responses.onSuccess(res, result);
    })
    .catch(error => {
      next(error);
    });
};

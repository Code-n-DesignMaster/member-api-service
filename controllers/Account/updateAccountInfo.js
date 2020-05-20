'use strict';

const _ = require('lodash');

const responses = require('../../utils/responses');
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

const models = require('@sp/mongoose-models');
const AccessToken = models.AccessToken;

const debug = require('debug')('app:controller:Account:updateAccountInfo');

module.exports = async (req, res, next) => {
  try {
    const currentInfo = await memberApi.account.getAccountInfo(req.memberApiAccessToken);
    debug('userId', currentInfo.body.id);
    await update(adapt(req.body), currentInfo.body, req.memberApiAccessToken);

    if ((req.body.contact && req.body.contact.country) || req.body.language || req.body.language === 0) {
      debug('update accessTokens');
      const userInfo = await memberApi.account.getAccountInfo(req.memberApiAccessToken);
      return AccessToken.updateMany({userId: currentInfo.body.id}, {$set: {'user': userInfo.body}}, {})
        .then(() => {
          responses.onSuccess(res, {});
        }).catch(() => {
          responses.onSuccess(res, {});
        })
    }

    return responses.onSuccess(res, {});
  } catch (err) {
    next(err);
  }
};

function update(data, current, memberApiAccessToken) {
  const accountInfo = _.omit(data, ['contact', 'notifications', 'plan', 'email']);
  const { contact, notifications, email } = data;

  const callstack = [];

  if(accountInfo) callstack.push(memberApi.account.updateAccountInfo(accountInfo, memberApiAccessToken));
  if(contact) callstack.push(memberApi.account.updateAccountContact(contact, memberApiAccessToken));
  if(notifications) callstack.push(memberApi.account.updateAccountNotificationSettings(notifications, memberApiAccessToken));
  if(email) callstack.push(updateAccountEmail(email, current.email, memberApiAccessToken));

  return Promise.all(callstack);
}

function adapt(data) {
  if (!data.hasOwnProperty('emailContentType')) return data;

  switch (data.emailContentType.toString().toLowerCase()) {
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
}

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

'use strict';

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

module.exports = (req, res, error) => {
  const limitValue = req.query.limit;
  const offsetValue = req.query.offset;
  const limit = limitValue ? '?limit=' + limitValue : '';
  const offset = offsetValue ? 'offset=' + offsetValue : '';

  let limitOffset = '';

  if (limit && offset) {
    limitOffset = limit + '&' + offset;
  } else if (limit) {
    limitOffset = limit;
  } else if (offset) {
    limitOffset = '?' + offset;
  }

  memberApi.account.getEmailNotifications(req.memberApiAccessToken, limitOffset)
    .then(result => {
      res.status(result.statusCode).send(result.body);
    })
    .catch(error => next(error));
};

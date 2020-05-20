'use strict';

const models = require('@sp/mongoose-models');
const OAuthAccount = models.OAuthAccount;

module.exports = function (req, res) {
  const { vendor, id } = req.params;

  OAuthAccount.findOne({
    userId: req.userId,
    oauthAccountId: id,
    vendor
  })
    .remove()
    .then(() => res.send({}));
};

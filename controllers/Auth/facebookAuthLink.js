'use strict';

const qs = require('querystring');
const memberApiRep = require('../../app/repositories/memberApiRepository');

const authUrl = `https://www.facebook.com/v2.8/dialog/oauth?`;

module.exports = function (req, res) {
  const resellerId = req.query.resellerId || 1;

  memberApiRep.getResellerCred(resellerId, 'oauth', 'facebook')
    .then(result => {
      const params = qs.stringify({
        client_id: result.body.clientId,
        redirect_uri: result.body.linkCallbackUrl,
        scope: 'email'
      });

      const state = JSON.stringify({
        resellerId,
        accessToken: req.accessToken
      });

      res.redirect(authUrl + params + `&state=${ state }`);
    });
};

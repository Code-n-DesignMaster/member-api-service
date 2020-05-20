'use strict';

const qs = require('querystring');
const memberApiRep = require('../../app/repositories/memberApiRepository');

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?`;

module.exports = function (req, res) {
  const resellerId = req.query.resellerId || 1;

  memberApiRep.getResellerCred(resellerId, "oauth", "google")
    .then(result => {

      const params = qs.stringify({
        client_id: result.body.clientId,
        redirect_uri: result.body.callbackUrl,
        scope: 'email',
        access_type: 'offline',
        response_type: 'code',
        include_granted_scopes: true,
        prompt: 'select_account'
      });

      const state = JSON.stringify({ resellerId });

      res.redirect(authUrl + params + `&state=${ state }`);
    });
};

const geoip = require('geoip-lite');
const models = require('@sp/mongoose-models');

const apiComponent = require('../../api/apiComponent');
const eventSubscriptions = require('../../controllers/Events/eventWorkers/eventSubscriptions');

const memberApi = apiComponent.getApi('member');
const AccessToken = models.AccessToken;

const localhost = '127.0.0.1';

module.exports = class Auth {
  create(req, memberApiAccessToken) {
    const lookup = geoip.lookup(req.realIP);

    const country = lookup && lookup.country
      ? lookup.country
      : req.realIP === localhost ? 'Local' : 'Unknown';

    return memberApi.account.getAccountInfo(memberApiAccessToken)
      .then(r => r.body)
      .then(accountInfo => {
        const data = {
          memberApiAccessToken,
          userId: accountInfo.id,
          user: accountInfo,
          ipAddress: req.realIP,
          rememberMe: false,
          metadata: {
            userAgent: req.useragent,
            country
          }
        };

        return createAccessToken(data)
      })
  }
}

// ===================================

function createAccessToken(data) {
  return Promise
    .all([
      AccessToken.create(data),
      new eventSubscriptions(data.userId).updateDataWhenLogin(),
    ])
    .then(([accessToken]) => accessToken._id)
}

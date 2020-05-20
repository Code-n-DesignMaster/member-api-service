const AuthService = require('../../app/serviceLayer/Auth');
const apiComponent = require('../../api/apiComponent');

const memberApi = apiComponent.getApi('member');
const accessTokenTypes = ['user'];

module.exports = function (req, res, next) {
  let authResult;

  memberApi.platform.auth(req.body)
    .then(result => {
      authResult = result.body;

      return accessTokenTypes.includes(result.body.type)
        ? (new AuthService()).create(req, result.body.accessToken)
        : Promise.resolve(result.body.accessToken);
    })
    .then(accessToken => {
      authResult.accessToken = accessToken;
      return res.send(authResult)
    })
    .catch(next);
};

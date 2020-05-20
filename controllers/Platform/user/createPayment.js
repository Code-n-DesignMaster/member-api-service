const AuthService = require('../../../app/serviceLayer/Auth');
const apiComponent = require('../../../api/apiComponent');

const memberApi = apiComponent.getApi('member');

module.exports = function (req, res, next) {

  let authResult;

  memberApi.platform.user.createPayment(req.params.userId, req.body)
    .then(result => {
      authResult = result.body;

      return (new AuthService()).create(req, result.body.accessToken);
    })
    .then(accessToken => {
      authResult.accessToken = accessToken;
      return res.send(authResult)
    })
    .catch(next);
}

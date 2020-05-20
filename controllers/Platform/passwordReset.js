const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member'); 

module.exports = function (req, res, next) {
  memberApi.platform.passwordReset(req.body)
    .then(result => res.send(result.body))
    .catch(next);
};

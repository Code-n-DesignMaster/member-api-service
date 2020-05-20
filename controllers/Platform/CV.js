const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member'); 

module.exports = function (req, res) {
  memberApi.platform.createCV(req, res);
}

const apiComponent = require('../../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

const models = require('@sp/mongoose-models');

const AccessToken = models.AccessToken;

module.exports = class AccessTokenGenerator {
  constructor(userId) {
    this.userId = userId;
  }

  async generate() {
    const memberApiAccessToken = (await memberApi.auth.authByApiKey(this.userId)).body.accessToken;
    const accountInfo = (await memberApi.account.getAccountInfo(memberApiAccessToken)).body;

    const accessToken = await AccessToken.create({
      userId: this.userId,
      memberApiAccessToken,
      user: accountInfo,
      ipAddress: "0.0.0.0",
      isSystem: true
    });

    return accessToken._id;
  }
}

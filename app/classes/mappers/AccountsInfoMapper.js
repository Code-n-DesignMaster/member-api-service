const { AccountsInfo } = require('@sp/mongoose-models');

module.exports = class AccountsInfoMapper {
  static findById(userId) {
    return AccountsInfo
      .findOne({ _id: userId })
      .lean();
  }
}

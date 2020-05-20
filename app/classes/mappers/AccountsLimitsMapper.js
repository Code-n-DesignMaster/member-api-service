const { AccountsLimits } = require('@sp/mongoose-models');

module.exports = class AccountsLimitsMapper {
  static findById(userId) {
    return AccountsLimits
      .findOne({ _id: userId })
      .lean();
  }
};

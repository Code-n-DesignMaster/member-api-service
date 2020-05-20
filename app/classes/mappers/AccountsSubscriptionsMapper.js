const Mapper = require('./Mapper');
const { AccountsSubscriptions } = require('@sp/mongoose-models');
const { SubscriptionModel } = require('@sp/nodejs-utils/classes/models');

module.exports = new class AccountsSubscriptionsMapper extends Mapper {
  constructor() {
    super(AccountsSubscriptions, SubscriptionModel);
  }
}

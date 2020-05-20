const { AccountsSubscriptionsMapper, AccessTokenMapper } = require('../mappers');
const memberApi = (require('../../../api/apiComponent')).getApi('member');

module.exports = class ShowEcommerceTemplateSpecification {
  static isSatisfiedBy(accessToken) {
    if (!accessToken) return Promise.resolve(false);
    
    return AccessTokenMapper.findById(accessToken, 'userId user')
      .then(doc => {
        if (!doc) return false;

        return Promise
          .all([
            memberApi.reseller.getResellerSettings(doc.user.resellerId, 'plan'),
            AccountsSubscriptionsMapper.one({ userId: doc.userId }),
          ])
          .then(([plan, subscription]) => {
            const enableEcommerceTemplate = plan.settings.find(s => s.settingTechnicalName === 'enableEcommerceTemplate');

            if (!enableEcommerceTemplate || enableEcommerceTemplate.value !== 'true') return Promise.resolve(false);
            if (!subscription) return false;

            return subscription.isEcommerceEnabled();
          });
      });
  }
};

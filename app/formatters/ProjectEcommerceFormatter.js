const { PausedEcommerceFeatureSpecification } = require('../classes/specifications/');

module.exports = class {
  constructor(projectEcommerce, projectMenu, subscription) {
    this.projectEcommerce = projectEcommerce || {};
    this.projectMenu = projectMenu || {};
    this.subscription = subscription;
  }

  format() {
    return {
      version: '2',
      status: this.getStatus(),
      storeId: this.projectEcommerce.storeId,
      publicKey: this.projectEcommerce.publicKey,
      storeUrl: this.getStorePageUrl(),
    };
  }

  getStatus() {
    const isActiveEcommerce = this.projectEcommerce.status === 'active';

    if (PausedEcommerceFeatureSpecification.isSatisfiedBy(this.subscription) && isActiveEcommerce) {
      return 'suspended';
    }

    if (isActiveEcommerce) {
      return 'active';
    }

    return null;
  }

  getStorePageUrl() {
    let url = 'store'; // Default value
    const isEcomItemFn = item => item.ecommerce;
    [
      ...this.projectMenu.unlinked || [],
      ...this.projectMenu.list || [],
    ]
      .some(menuItem => {
        if (!menuItem || isEcomItemFn(menuItem)) return;

        const parentStoreMenuItem =
          !menuItem.homepage
          && menuItem.children && menuItem.children.length
          && menuItem.children.find(isEcomItemFn)
          && menuItem;

        if (parentStoreMenuItem) {
          url = `${parentStoreMenuItem.tag}/${url}`;
          return true;
        }
      });

    return url;
  }
};

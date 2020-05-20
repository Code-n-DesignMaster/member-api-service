const Filter = require('./Filter');
const {
  TemplateLocaleCriteria,
  TemplateTypeCriteria,
  TemplateEcommerceCriteria,
} = require('../criteria');

module.exports = class TemplatesListFilter extends Filter {
  filter(isShowEcommerce, locales, types) {
    this.addFilter(new TemplateEcommerceCriteria(isShowEcommerce));
    this.addFilter(new TemplateLocaleCriteria(locales));
    this.addFilter(new TemplateTypeCriteria(types));

    return super.filter();
  }
};

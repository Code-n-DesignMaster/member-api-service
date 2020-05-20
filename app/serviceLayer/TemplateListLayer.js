'use strict';

const apiComponent = require('../../api/apiComponent');

const {
  ShowEcommerceTemplateSpecification,
} = require('../../app/classes/specifications');

const { TemplatesListFilter } = require('../../app/classes/filters');
const { TemplateV2Mapper } = require('../../app/classes/mappers');

const memberApi = apiComponent.getApi('member');

module.exports = class TemplateLlistLayer {
  constructor(req, Formatter) {
    this.query = req.query;
    this.accessToken = req.accessToken;
    this.memberApiAccessToken = req.memberApiAccessToken;
    this.Formatter = Formatter;
  }

  async get() {
    const where = {
      position: { $exists: true },
      hidden: { $ne: true },
      deleted: { $ne: true },
    };

    const sort = { position: 1, createdAt: -1 };

    if (this.query.editor) {
      where.title = { $ne: 'Blank' };
    }

    return Promise
      .all([
        ShowEcommerceTemplateSpecification.isSatisfiedBy(this.accessToken),
        TemplateV2Mapper.populateMany(where, ['categories', 'versions'], sort),
        memberApi.account.getAccountTemplateSetting(this.memberApiAccessToken),
      ])
      .then(([isShowEcommerceTemplate, templates, templateSettingResponse]) => {
        this.settings = templateSettingResponse.body;

        const filtered = (new TemplatesListFilter(templates))
          .filter(isShowEcommerceTemplate, this.settings.locales, this.settings.types);

        return filtered.map(template => new this.Formatter(template).format(this.settings.locales, this.settings.types));
      });
  }

  async list() {
    const templates = await this.get();

    return sortByLocales(templates, this.settings.locales);
  }
};

function sortByLocales(formatedList, locales) {
  let sortedList = [];
  const localeGroups = locales.reduce((acc, item) => { acc[item] = []; return acc; }, {});

  for(let group in localeGroups) {
    for(let i = 0; i < formatedList.length; i++) {
      const template = formatedList[i];
      if(template && template.versions[0].locale.includes(group)) {
        localeGroups[group].push(template);
        delete formatedList[i];
      }
    }
  }

  for(let group in localeGroups) {
    sortedList = sortedList.concat(localeGroups[group]);
  }

  return sortedList;
}

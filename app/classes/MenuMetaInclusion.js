'use strict';

const logger = require('../../helpers/logger');

module.exports = class MenuMetaInclusion {
  constructor(menu) {
    this.menu = menu;
  }

  include(resellerSettings, isFreeAccount) {
    const {metaTags, general} = resellerSettings;
    const isPopulatePageMeta = metaTags.populatePageMeta;
    const accountType = isFreeAccount ? 'free' : 'paid';

    const pages = [].concat(this.menu.list, this.menu.unlinked, ...this.menu.list.map(p => p.children), ...this.menu.unlinked.map(p => p.children));

    const title = getMetaTagValue(metaTags[`${accountType}Title`]);
    const description = getMetaTagValue(metaTags[`${accountType}Description`]);
    const partnerName = general.partnerName;
    const removeForbiddenSymbols = str => str && str.replace(/(<([^>]+)>|["'])/gi, '') || str;

    pages.forEach(page => {
      page.title = page.title ? removeForbiddenSymbols(page.title) : fillPayload(title, page, partnerName, isPopulatePageMeta);
      page.description = page.description ? removeForbiddenSymbols(page.description): fillPayload(description, page, partnerName, isPopulatePageMeta)
    });

    return this.menu;
  }
};

function fillPayload(text, page, partnerName, isPopulatePageMeta) {
  return isPopulatePageMeta
    ? text.replace('$pageName$', page.name).replace('$partnerName$', partnerName)
    : '';
}

function getMetaTagValue(value) {
  if (!value) return '';

  try {
    return JSON.parse(value).blocks.reduce((previousValue, currentValue) => {
      return previousValue + currentValue.text;
    }, '');
  } catch (err) {
    logger.error(err);
    return '';
  }
}

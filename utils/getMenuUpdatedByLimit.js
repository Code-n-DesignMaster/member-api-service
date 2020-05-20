'use strict';

const debug = require('debug')('app:utils:getMenuUpdatedByLimit');

module.exports = (menu, maxAllowedPages) => {
  debug('AllowedLimit:', maxAllowedPages);

  const updatedMenu = {
    list: [],
    unlinked: [],
    outOfPlan: menu.outOfPlan,
    hidden: menu.hidden
  };

  const listCount = getListCount(menu.list);
  const unlinkedCount = getListCount(menu.unlinked);
  const outOfPlanCount = getListCount(menu.outOfPlan);

  debug('Menu pages count:', (listCount + unlinkedCount));
  debug('outOfPlanCount:', outOfPlanCount);

  // All item in limit
  if ((listCount + unlinkedCount) <= maxAllowedPages) {
    debug('All pages in limit');
    if (!outOfPlanCount) {
      return null;
    }
    updatedMenu.list = menu.list;
    updatedMenu.unlinked = menu.unlinked;
    maxAllowedPages = maxAllowedPages - listCount - unlinkedCount;
    extendGroup('list', maxAllowedPages, menu, updatedMenu);
  } else if (listCount <= maxAllowedPages) { // List in limit and some unlinked outOfLimit
    debug('List pages in limit');
    updatedMenu.list = menu.list;
    maxAllowedPages = maxAllowedPages - listCount;
    // Move some item from unlinked to outOfLimit
    limitGroup('unlinked', maxAllowedPages, menu, updatedMenu);
  } else {
    debug('Limit affect list');
    // Move item from list that over limit to outOfPlan
    limitGroup('list', maxAllowedPages, menu, updatedMenu);
    // Move all item from unlinked to outOfLimit
    limitGroup('unlinked', 0, menu, updatedMenu);
  }

  return updatedMenu;
};

/**
 * move all items went over 'allowedLimit' from 'group' to 'outOfPlan'
 * @param {"list"|"unlinked"|"unlinked"|"outOfPlan"} group
 * @param {Number} allowedLimit
 * @param menu
 * @param updatedMenu
 */
function limitGroup(group, allowedLimit, menu, updatedMenu) {
  let updateGroup = menu[group];
  // Move homepage to first position
  if (group === 'list') {
    updateGroup = [updateGroup.find(item => item.homepage), ...updateGroup.filter(item => !item.homepage)];
  }

  updateGroup.forEach((page) => {
    if (pageItemCount(page) <= allowedLimit) {
      updatedMenu[group].push(page);
      allowedLimit = allowedLimit - pageItemCount(page);
      return;
    }

    if (allowedLimit && pageItemCount(page) > allowedLimit) {
      if (!isSystemPage(page)) allowedLimit--;

      const filtered = page.children.reduce((acc, item) => {
        if (isSystemPage(item)) {
          acc.allowed.push(item);
          return acc;
        }
        if (allowedLimit) {
          acc.allowed.push(item);
          allowedLimit--;
          return acc;
        }
        acc.outLimit.push(item);
        return acc;
      }, {
        allowed: [],
        outLimit: []
      });

      page.children = filtered.allowed;

      if (filtered.outLimit.length === 1) {
        updatedMenu['outOfPlan'].push(filtered.outLimit[0]);
      } else {
        const newParent = filtered.outLimit.shift();
        newParent.children = filtered.outLimit;
        updatedMenu['outOfPlan'].push(newParent);
      }

      updatedMenu[group].push(page);
      return;
    }

    if (!allowedLimit) {
      updatedMenu['outOfPlan'].push(page);
    }
  });

}

/**
 * extend 'group' to 'allowedLimit' from 'outOfPlan'
 * @param {"list"|"unlinked"|"unlinked"|"outOfPlan"} group
 * @param {Number} allowedLimit
 * @param menu
 * @param updatedMenu
 */
function extendGroup(group, allowedLimit, menu, updatedMenu) {
  const extend = [];

  menu.outOfPlan.forEach((page) => {
    if (pageItemCount(page) <= allowedLimit) {
      extend.push(page);
      allowedLimit = allowedLimit - pageItemCount(page);
      return;
    }
  });
  updatedMenu[group] = updatedMenu[group].concat(extend);
  updatedMenu.outOfPlan.splice(0, extend.length);
}

function pageItemCount(page) {
  let count = 0;
  if (!isSystemPage(page)) count++;

  page.children.forEach((item) => {
    if (!isSystemPage(item)) count++;
  });

  return count;
}

function getListCount(list) {
  let count = 0;
  list.forEach((item) => {
    if (!isSystemPage(item)) ++count;
    if (item.children && item.children.length) {
      item.children.forEach((child) => {
        if (!isSystemPage(child)) ++count;
      });
    }
  });

  return count;
}

function isSystemPage(page = {}, includeHomePage = false) {
  let isSystem = false;

  if (page.isSystem) isSystem = true;
  if (page.ecommerce) isSystem = true;
  if (page.blog) isSystem = true;

  if (includeHomePage) {
    if (page.homepage) isSystem = true;
  }

  if (page.type && page.type !== 'page') {
    isSystem = true;
  }

  return isSystem;
}

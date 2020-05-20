const _ = require('lodash');
const uuid = require('uuid/v4');
const MenuPageItem = require('./MenuPageItem');

class Menu {
  constructor(projectId, menu, maxAmoundOfPages) {
    this.projectId = projectId;
    this.list = menu.list;
    this.unlinked = menu.unlinked;
    this.outOfPlan = menu.outOfPlan || [];
    this.hidden = menu.hidden || [];
    this.maxAmoundOfPages = maxAmoundOfPages;
    this.pagesCount = 0;
  }

  getPageByHash(hash) {
    const rootPages = [...this.list, ...this.unlinked, ...this.hidden];
    const pages = rootPages.concat(...rootPages.map(p => p.children));

    const page = pages.find(p => p.hash === hash);

    return new MenuPageItem(page);
  }

  generateMenuId() {
    this.id = uuid();
  }

  /**
   * get grouped list by given limit
   * @return {Object} grouped object;
   */
  getGroupedListByLimit() {
    const list = this._findAcceptedPagesByLimit(this.list);
    const unlinked = this._findAcceptedPagesByLimit(this.unlinked);
    const hidden = this._findAcceptedPagesByLimit(this.hidden);
    return {
      projectId: this.projectId,
      list,
      unlinked,
      hidden,
      outOfPlan: this.outOfPlan
    };
  }

  /**
   * find out can add some page
   * @return {Boolean} can or can't
   */
  canAddPage(count = 1) {
    const length = this.pagesCount
      ? this.pagesCount
      : this._countPagesLength();

    return (length + count) <= this.maxAmoundOfPages;
  }


  /**
   * count pages length
   * @return {Number} count of pages
   */
  _countPagesLength() {

    let length = 0;

    [...this.list, ...this.unlinked] // hidden no sense to include
      .forEach(item => {

        if (!Menu.isSystemPage(item)) {
          length++;
        }

        length += item.children.filter(i => !Menu.isSystemPage(i)).length;
      });

    return length;
  }

  /**
   * increment page count
   * @return {undefined};
   */
  _incPages() {
    this.pagesCount += 1;
  }

  get _isLimitReached() {
    return this.pagesCount >= this.maxAmoundOfPages;
  }

  /**
   * check is system page
   * @param page
   * @param includeHomePage
   * @returns {boolean}
   */
  // static isSystemPage(page = {}, includeHomePage = false) {
  //   // const types = ['link', 'folder'];
  //   const props = ['type', 'ecommerce', 'blog', 'isSystem'];
  //
  //   if (includeHomePage)
  //     props.push('homepage');
  //
  //   return !!(page && props.find(p => p in page && page[p]));
  // }

  static isSystemPage(page = {}, includeHomePage = false) {
    let isSystem = false;

    if(page.isSystem) isSystem = true;
    if(page.ecommerce) isSystem = true;
    if(page.blog) isSystem = true;

    if (includeHomePage) {
      if(page.homepage) isSystem = true;
    }

    if(page.type && page.type !== 'page') {
      isSystem = true;
    }

    return isSystem;
  }

  /**
   * find accepted pages by given limit
   * @param  {Array} list  list of pages
   * @return {Array}       filtered list
   */
  _findAcceptedPagesByLimit(list) {

    let acceptedList = [];

    for (const page of list) {

      if (Menu.isSystemPage(page) && !page.children.length) {
        acceptedList.push(page);
        continue;
      }

      if (!page.children) {
        page.children = [];
      }


      // if page with child or homepage with child and limit is not reached
      if (page.children.length && (!page.homepage || page.homepage && !this._isLimitReached)) {
        if (this._isLimitReached && !Menu.isSystemPage(page, true)) {
          const allowed = page.children.filter(item => Menu.isSystemPage(item));
          acceptedList.push(...allowed);
          continue;
        }

        if (!Menu.isSystemPage(page)) this._incPages();

        // filter children
        page.children = page.children.filter(item => {
          // remain if link or folder
          if (Menu.isSystemPage(item)) return true;

          if (this._isLimitReached) {
            this.outOfPlan.push(item);
            return false;
          } else {
            this._incPages();
            return true;
          }

        });

        acceptedList.push(page);
        continue;
      }

      if (page.homepage && page.children.length && !this._isLimitReached) {

        page.children = page.children.filter(item => {
          // remain if link or folder
          if (Menu.isSystemPage(item)) return true;

          if (this._isLimitReached) {
            this.outOfPlan.push(item);
            return false;
          } else {
            this._incPages();
            return true;
          }

        });

      }

      // if limit reached
      // else limit reached and homepage is going to enter in outOfPlan list
      if (this._isLimitReached && !page.homepage) {
        this.outOfPlan.push(page);
        continue;
      } else if (this._isLimitReached) {
        const last = _.findLastIndex(acceptedList, item => !Menu.isSystemPage(item));

        // if last page has children then need to push child to outOfPlan list
        // else root page
        if (last >= 0 && acceptedList[last].children.length) {
          const lastChild = _.findLastIndex(acceptedList[last].children, item => !Menu.isSystemPage(item));
          this.outOfPlan.push(...acceptedList[last].children.splice(lastChild, 1));
        } else {
          this.outOfPlan.push(...acceptedList.splice(last, 1));
        }

        // if limit is reached and homepage has children
        if (page.children.length) {
          page.children = page.children.filter(item => {
            if (Menu.isSystemPage(item)) return true;

            this.outOfPlan.push(item);
          });
        }

        this._incPages();
      }

      this._incPages();
      acceptedList.push(page);
    }

    // if have no enough space for pages
    if (this._isLimitReached) return acceptedList;

    // if need to add pages to acceptedList
    this.outOfPlan = this._upgradeList(acceptedList);

    return acceptedList;
  }

  /**
   * update list by pointer
   * @param  {Array} acceptedList Point to accepted list
   * @return {Array}              OutOfPlan list
   */
  _upgradeList(acceptedList) {
    const subOutOfPlan = [];

    this.outOfPlan = this.outOfPlan.filter(page => {

      if (this._isLimitReached) return true;

      if (page.children && page.children.length) {

        this._incPages();

        page.children = page.children.filter(sub => {
          if (Menu.isSystemPage(sub)) return true;

          if (this._isLimitReached) {
            subOutOfPlan.push(sub);
            return false;
          } else {
            this._incPages();
            return true;
          }
        });

      }

      acceptedList.push(page);

      this._incPages();
    });

    return [...this.outOfPlan, ...subOutOfPlan];
  }
}

module.exports = Menu;

'use strict';

module.exports = class Seeker {
  constructor(pages, menu) {
    this.section = pages;
    this.menu = [...menu.list, ...menu.unlinked, ...menu.hidden || []];
    this.found = {};
  }

  /**
   * Find element by names
   * @param  {Array}  names
   * @param  {Object | Array}  data
   * @return {undefined}
   */
  findByNames(names, data = this.section, _id) {

    data.forEach(element => {

      if (!element) return;

      const name = names.includes(element.name) && element.name;


      if (name) {
        const result = this[`${name}Handler`](element, _id);

        if (result) {

          if (this.found[name]) {
            this.found[name].push(result);
          } else {
            this.found[name] = [result];
          }
        }
      }

      const isArray = Array.isArray(element.elements || element.sections);

      if (isArray) {
        this.findByNames(names, element.elements || element.sections, _id ? _id : element._id);
      }
    });
  }

  /**
   * Get link by Hash
   * @param  {String} hash
   * @param  {Array} list
   * @return {String}
   */
  getLinkByHash(hash, list = this.menu) {

    for (const item of list) {

      if (item.hash === hash) {
        return `/${item.tag}`;
      } else if (item.children) {
        const child = item.children.find(item => item.hash === hash);

        if (child) {
          return item.homepage ? `/${child.tag}` : `/${item.tag}/${child.tag}`;
        }
      }
    }

    return '/';
  }

  getLinkForAnchor(hash, pageId, list = this.menu) {
    if (!hash) {
      hash = pageId;
    }

    if (hash === pageId) {
      return '';
    }

    for (const item of list) {

      if (item.hash === hash) {
        if (item.homepage) {
          return '/';
        }

        return `/${item.tag}`;
      } else if (item.children) {
        const child = item.children.find(item => item.hash === hash);

        if (child) {
          return item.homepage ? `/${child.tag}` : `/${item.tag}/${child.tag}`;
        }
      }
    }

    return '';
  }

  // Private

  /**
   * hander for button
   * @param  {Object} element
   * @return {undefined}
   */
  buttonHandler(element) {

    const dynamic = element.options.dynamic;

    if (!dynamic.linkView) {
      if (dynamic.linkAddress !== undefined) {
        dynamic.linkAddress = this.getLinkByHash(dynamic.linkAddress);
      }
    } else {
      const view = dynamic.linkView.toLowerCase();
      dynamic.linkAddress = this._changeLinkValue(view, dynamic.linkAddress);
    }
  }

  /**
   * hander for image
   * @param  {Object} element
   * @return {undefined}
   */
  imageHandler(element) {

    const dynamic = element.options.dynamic;

    if (!dynamic.link) return;

    dynamic.link.href = this._changeLinkValue(dynamic.link.type, dynamic.link.href);
  }

  /**
   * hander for header button
   * @param  {Object} element
   * @return {Function}
   */
  header_buttonHandler(element) {
    return this.buttonHandler(element);
  }

  /**
   * hander for footer button
   * @param  {Object} element
   * @return {Function}
   */
  footer_buttonHandler(element) {
    return this.buttonHandler(element);
  }

  /**
   * hander for redactor (text)
   * @param  {Object} element
   * @return {undefined}
   */
  redactorHandler(element, pageId) {
    let entityMap = element.options.entityMap;

    if (!entityMap) return;
    if(Array.isArray(entityMap)) {
        entityMap = Object.assign({}, entityMap)
    }


    for (const item in entityMap) {
      if(!entityMap[item]) continue;
      if (entityMap[item].type !== 'ELINK' || !entityMap[item].data.linkView) continue;

      const view = entityMap[item].data.linkView.toLowerCase();
      entityMap[item].data.href = this._changeLinkValue(view, entityMap[item].data.href, pageId);
    }
  }

  /**
   * hander for form
   * @param  {Object} element
   * @return {Object}
   */
  formHandler(element) {

    return {
      fields: element.options.rows,
      hash: element.options.hash,
      connection: element.options.connection
    };
  }

  _changeLinkValue(type, value, pageId) {

    if (type === 'page') {
      return this.getLinkByHash(value);
    } else if (type === 'anchor') {
      return this.getLinkForAnchor(value, pageId);
    } else if (type === 'phone') {
      return `tel:${value}`;
    } else if (type === 'email') {
      return `mailto:${value}`;
    } else if (type === 'url') {
      return this._filterLink(value);
    }

    return value;
  }

  _filterLink(link = '') {
    if (link === null) {
      link = '';
    }

    link = link.trim();

    if (link.length > 0) {
      if (link.search(/^https?:\/\//i) == -1) {
        link = 'http://' + link;
      }
    }
    else {
      link = '#';
    }

    return link;
  }

  filterUrls(list = this.menu) {
    list.map(item => {
      if (item.type === 'link') {
        item.tag = this._filterLink(item.tag);
      }

      if (item.children !== undefined) {
        if (item.children.length > 0) {
          this.filterUrls(item.children);
        }
      }
    });

  }
};

'use strict';

module.exports = class Seeker {
  constructor(sections) {
    this.sections = sections;
    this.updatedSections = [];
    this.updatedSectionsId = [];
  }

  /**
   * Find element by names
   * @param  {Array}  names
   * @param  {Object | Array}  data
   * @return {undefined}
   */
  updateElementByNames(names, cb) {

    for (const section of this.sections) {
      const sectionId = section.options.hash;

      if (names.includes(section.name)) {
        if (cb(section)) {
          this.addSectionToUpdateList(section, sectionId);
        }
      }

      this.findElementsByNames(names, section.elements, element => {
        if (cb(element)) {
          this.addSectionToUpdateList(section, sectionId);
        }
      });
    }

    return this.updatedSections;
  }

  addSectionToUpdateList(section, id) {
    if (!this.updatedSectionsId.includes(id)) {
      this.updatedSectionsId.push(id);
      this.updatedSections.push(section);
    }
  }

  findElementsByNames(names, elements, cb) {

    if (!elements) return;

    elements.forEach(element => {

      if (!element) return;

      const name = names.includes(element.name) && element.name;

      if (name) {
        cb(element);
      }

      const isArray = Array.isArray(element.elements);

      if (isArray) {
        this.findElementsByNames(names, element.elements, cb);
      }
    });
  }
};


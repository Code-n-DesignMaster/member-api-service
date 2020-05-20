'use strict';

const models = require('@sp/mongoose-models');
const ProjectTemplate = models.ProjectTemplate;
const ProjectTemplatePage = models.ProjectTemplatePage;

module.exports = (req, res, next) => {
  const projectId = req.params.projectId;

  return Promise.all([
    ProjectTemplatePage.find({ projectId })
      .populate('sections', 'section')
      .select('sections').lean(),
    ProjectTemplate.findOne({ projectId })
      .populate('header', 'section')
      .populate('footer', 'section')
      .populate('stickyElement', 'elements')
      .populate('menu', 'list unlinked outOfPlan hidden -_id')
      .select('header footer menu beforeCreate stickyElement templateIndex')
      .lean()
  ])
    .then(([pages, template]) => {
      pages = pages.reduce((acc, page) => {
        acc[page._id] = page.sections.map(item => item.section);
        return acc;
      }, {});

      res.send({
        menu: template.menu,
        header: template.header.section,
        footer: template.footer.section,
        pages
      });
    })
    .catch(err => next(err));
};

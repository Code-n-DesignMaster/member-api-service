const { TemplateFormatter } = require('../../app/formatters');
const TemplateListLayer = require('../../app/serviceLayer/TemplateListLayer');

module.exports = (req, res, next) => {
  new TemplateListLayer(req, TemplateFormatter).list()
    .then(result => res.send(result))
    .catch(next);
};

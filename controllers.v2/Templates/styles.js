const { TemplateStylesFormatter } = require('../../app/formatters');
const TemplateListLayer = require('../../app/serviceLayer/TemplateListLayer');

module.exports = (req, res, next) => {
  new TemplateListLayer(req, TemplateStylesFormatter).get()
    .then(result => res.send(result))
    .catch(next);
}

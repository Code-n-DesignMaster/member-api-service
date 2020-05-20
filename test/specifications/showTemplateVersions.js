require('should')
const { ShowTemplateVersionSpecification } = require('../../app/classes/specifications')

describe('Specifications: ShowTemplateVersions', () => {
  it('should satisfiend with ordinary template', () => {
    ShowTemplateVersionSpecification.isSatisfiedBy({ hidden: false }, true).should.be.ok();
  })

  it('should not satisfiend with hidden template', () => {
    ShowTemplateVersionSpecification.isSatisfiedBy({ hidden: true }, true).should.be.not.ok();
  })

  it('should satisfiend with ecommerce template', () => {
    ShowTemplateVersionSpecification.isSatisfiedBy({ hidden: false, versionName: 'ecommerce'}, false).should.be.not.ok();
  })

  it('should not satisfiend with ecommerce template', () => {
    ShowTemplateVersionSpecification.isSatisfiedBy({ hidden: false, versionName: 'ecommerce'}, true).should.be.ok();
  })
})

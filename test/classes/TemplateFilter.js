require('should');
const { TemplateLocaleCriteria, TemplateTypeCriteria, TemplateEcommerceCriteria } = require('../../app/classes/criteria');
const { TemplatesListFilter } = require('../../app/classes/filters');

describe('Template filter', () => {
  const templates = [
    { versions: [{ locale: ['en', 'pl'], versionName: 'onePage' }]},
    { versions: [{ locale: ['ch', 'en'], versionName: 'ecommerce' }, { locale: ['ch', 'en'], versionName: 'onePage' }]},
    { versions: [{ locale: ['ua'], versionName: 'multiPages' }]},
    { versions: [{ locale: ['ru'], versionName: 'onePage' }]},
    { versions: [{ locale: ['en', 'bl'], versionName: 'Other versionName' }]},
    { versions: [{ locale: ['au', 'cn'], versionName: 'ecommerce' }]},
  ];

  describe('Locale criteria', () => {
    it('should show only en templates', () => {
      new TemplateLocaleCriteria(['en']).filter(JSON.parse(JSON.stringify(templates))).forEach(template => {
        template.versions.forEach(v => v.locale.should.containDeep(['en']));
      });
    });

    it('should show empty list when locale not found', () => {
      new TemplateLocaleCriteria(['some']).filter(JSON.parse(JSON.stringify(templates))).forEach(t => t.versions.should.be.eql([]));
    });
  });

  describe('Type criteria', () => {
    it('should show only onePage templates', () => {
      new TemplateTypeCriteria(['onePage']).filter(JSON.parse(JSON.stringify(templates))).forEach(template => {
        template.versions.forEach(v => v.versionName.should.be.eql('onePage'));
      });
    });

    it('should show empty list when locale not found', () => {
      new TemplateTypeCriteria(['badType']).filter(JSON.parse(JSON.stringify(templates))).forEach(template => {
        template.versions.should.be.eql([]);
      });
    });
  });

  describe('Ecommerce criteria', () => {
    it('should show with ecommerce templates', () => {
      new TemplateEcommerceCriteria(true).filter(JSON.parse(JSON.stringify(templates))).should.be.eql(templates);
    });

    it('should not show with ecommerce templates', () => {
      new TemplateEcommerceCriteria(false).filter(JSON.parse(JSON.stringify(templates))).forEach(template => {
        template.versions.forEach(v => v.versionName.should.not.be.eql('ecommerce'));
      });

      new TemplateEcommerceCriteria(false).filter(JSON.parse(JSON.stringify(templates))).should.be.not.empty();
    });
  });

  describe('Template filtering', () => {
    it('filter params 1', () => {
      (new TemplatesListFilter(JSON.parse(JSON.stringify(templates)))).filter(true, ['en'], [ 'ecommerce', 'onePage'])
        .should.deepEqual([
          { versions: [{ locale: ['en', 'pl'], versionName: 'onePage' }]},
          { versions: [{ locale: ['ch', 'en'], versionName: 'ecommerce' }, { locale: ['ch', 'en'], versionName: 'onePage' }]},
        ]);
    })

  it('filter params 3', () => {
      (new TemplatesListFilter(JSON.parse(JSON.stringify(templates)))).filter(true, ['en'], ['onePage'])
        .should.deepEqual([
          { versions: [{ locale: ['en', 'pl'], versionName: 'onePage' }]},
          { versions: [{ locale: ['ch', 'en'], versionName: 'onePage' }]},
        ]);
    })

    it('filter params 2', () => {
      (new TemplatesListFilter(JSON.parse(JSON.stringify(templates)))).filter(true, ['en'], ['onePage'])
       .should.deepEqual([
          { versions: [{ locale: ['en', 'pl'], versionName: 'onePage' }]},
          { versions: [{ locale: ['ch', 'en'], versionName: 'onePage' }]},
        ]);
      })
  })

});

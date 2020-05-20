const config = require('./helpers/config');
let request = require('supertest');
request = request(config.serviceUrl);

const {
  assert,
} = require('chai');

describe('Templates controller', () => {
  describe('Get templates', () => {
    it('templates list', (done) => {
      request.get(`/templates`)
        .expect(200)
        .expect((res) => {
          assert.isArray(res.body);

          if(res.body.length > 0) {
            const template = res.body[0];

            assert.property(template, '_id');
            assert.match(template._id, config.regex.id);

            assert.property(template, 'title');
            assert.isString(template.title);

            if(template.hasOwnProperty('link')) {
              assert.match(template.link, config.regex.siteplusSubUrl);
            }

            assert.property(template, 'versions');
            assert.isArray(template.versions);

            template.versions.forEach((version) => {
              assert.property(version, '_id');
              assert.match(version._id, config.regex.id);

              assert.property(version, 'title');
              assert.isString(template.title);

              assert.property(version, 'type');
              assert.isString(template.type);
              assert.isNotEmpty(template.type);

              assert.property(version, 'hidden');
              assert.isBoolean(version.hidden);

              assert.property(version, 'link');
              assert.match(version.link, config.regex.siteplusSubUrl);

              assert.property(version, 'categories');
              version.categories.forEach((category) => {
                assert.isString(category);
                assert.isNotEmpty(category);
              });

              assert.property(version, 'description');
              assert.isString(version.description);

              assert.property(version, 'src');
              assert.isObject(version.src);

              assert.property(version.src, 'name');
              assert.isString(version.src.name);
              assert.isNotEmpty(version.src.name);

              assert.property(version.src, 'path');
              assert.isString(version.src.path);
              assert.isNotEmpty(version.src.path);
            });

            assert.property(template, 'categories');
            assert.isArray(template.categories);
            template.categories.forEach((category) => {
              assert.isString(category);
              assert.isNotEmpty(category);
            });

            assert.property(template, 'description');

            assert.property(template, 'src');
            assert.isObject(template.src);

            assert.property(template.src, 'name');
            assert.isString(template.src.name);
            assert.isNotEmpty(template.src.name);

            assert.property(template.src, 'path');
            assert.isString(template.src.path);
            assert.isNotEmpty(template.src.path);

            assert.property(template, 'styles');
            assert.isObject(template.styles);
          }
        })
        .end(done);
    });
  });
});

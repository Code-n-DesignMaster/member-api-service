const config = require('./helpers/config');
let request = require('supertest');
request = request(config.serviceUrl);

const {
  assert,
} = require('chai');

describe('Template Categories controller', () => {
  describe('Get template categories', () => {
    it('template categories list', (done) => {
      request.get(`/template-categories?accessToken=${global.token}`)
        .expect(200)
        .expect((res) => {
          assert.isArray(res.body);

          if(res.body.length > 0) {
            const templateCategory = res.body[0];

            assert.property(templateCategory, '_id');
            assert.isString(templateCategory._id);

            assert.property(templateCategory, 'name');
            assert.isString(templateCategory.name);

            assert.property(templateCategory, 'position');
            assert.isNumber(templateCategory.position);

          }
        })
        .end(done);
    });
  });
});

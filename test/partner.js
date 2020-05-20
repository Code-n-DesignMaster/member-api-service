const config = require('./helpers/config');
let request = require('supertest');
request = request(config.serviceUrl);

const {
  partner,
} = require('./mocks/index');
const {
  login,
  logout,
} = require('./helpers/hooks');

describe('Partner controller', () => {
  before((done) => {
    logout()
      .then(() => {
        return login(config.partnerTest.testLogin, config.partnerTest.testPassword);
      })
      .then(done);
  });

  after((done) => {
    logout()
      .then(() => {
        return login(config.testLogin, config.testPassword);
      })
      .then(done);
  });

  describe('Publish', function() {
    this.timeout(10000);

    it('publish type', (done) => {
      request.put(`/partner/bbcc1476-76a9-4096-bd6d-9b8608862acd/publish?accessToken=${global.token}`)
        .send({
          domainId: '0db9d4fa-0905-4c3c-9bbd-3cc0bb846362',
        })
        .expect(200, partner, done);
    });
  });

  describe('Unpublish', function() {
    this.timeout(5000);

    it('empty responce', (done) => {
      request.put(`/partner/bbcc1476-76a9-4096-bd6d-9b8608862acd/unpublish?accessToken=${global.token}`)
        .send({
          domainId: '0db9d4fa-0905-4c3c-9bbd-3cc0bb846362',
        })
        .expect(200, {}, done);
    });
  });
});

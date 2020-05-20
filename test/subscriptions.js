const config = require('./helpers/config');
let request = require('supertest');
request = request(config.serviceUrl);
const uuid = require('uuid/v1');

const {
  subscriptions,
} = require('./mocks/index');

describe('Subscriptions controller', () => {

  describe('Get subscriptions', () => {
    it('subscriptions list', (done) => {
      request.get(`/subscriptions?accessToken=${global.token}`)
        .expect(200, subscriptions.subscriptions, done);
    });
  });

  describe('Get subscription', () => {
    it('subscription', (done) => {
      request.get(`/subscriptions/2?accessToken=${global.token}`)
        .expect(200, subscriptions.subscription, done);
    });
  });

  describe('Create email subscription', () => {
    const testEmail = `testuser_${uuid()}@siteplus.com`;
    it('empty responce', (done) => {
      request.post(`/subscriptions/email/early-access?accessToken=${global.token}`)
        .send({
          email: testEmail,
        })
        .expect(200, {}, done);
    });

    it('500 Internal Server Error', (done) => {
      request.post(`/subscriptions/email/early-access?accessToken=${global.token}`)
        .send({
          email: testEmail,
        })
        .expect(500, {
          type: 'system',
          message: 'Internal Server Error',
        }, done);
    });

    it('validation message if email is incorrect', (done) => {
      request.post(`/subscriptions/email/early-access?accessToken=${global.token}`)
        .send({
          email: 'testuser@siteplus',
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'NOT_VALID',
              field: 'email',
              message: 'Sorry, email is not correct',
            }
          ]
        }, done);
    });
  });
});

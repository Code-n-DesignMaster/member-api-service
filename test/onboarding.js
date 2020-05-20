const config = require('./helpers/config');
let request = require('supertest');
request = request(config.serviceUrl);

const {
  onboarding,
} = require('./mocks/index');

describe('Onboarding controller', () => {

  describe('Get onboardings', () => {
    it('onboardings', (done) => {
      request.get(`/onboarding?accessToken=${global.token}`)
        .expect(200, onboarding.onboardings, done);
    });
  });

  describe('Get one onboarding', () => {
    it('onboarding', (done) => {
      request.get(`/onboarding/1?accessToken=${global.token}`)
        .expect(200, onboarding.onboarding, done);
    });
  });

  describe('Get onboarding steps', () => {
    it('onboarding steps', (done) => {
      request.get(`/onboarding/1/step?accessToken=${global.token}`)
        .expect(200, onboarding.onboardingStep, done);
    });
  });

  describe('Set onboarding step', () => {
    it('empty responce', (done) => {
      request.post(`/onboarding/1/step?accessToken=${global.token}`)
        .send({
          stepId: 1,
          action: 'skip',
        })
        .expect(200, {}, done);
    });
  });
});

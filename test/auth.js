const config = require('./helpers/config');
const _ = require('lodash');
const rp = require('request-promise');
let request = require('supertest');
request = request(config.serviceUrl);

const {
  auth,
} = require('./mocks/index');
const {
  assert
} = require('chai');

describe('Auth controller', () => {
  describe('Auth', () => {
    it('authentication data', (done) => {
      const authData = auth.auth;
      authData.accessToken = global.token;

      request.get(`/auth?accessToken=${global.token}`)
        .expect(200, authData, done);
    });

    it('not authenticated error if invalid access token', (done) => {
      request.get('/auth?accessToken=12345')
        .expect(403, {
          type: 'authentication',
          message: 'Not authenticated',
        }, done);
    });
  });

  describe('Auth by CRMS token', () => {
    const crms = auth.crms;
    let token;
    before((done) => {
      rp({
        method: 'POST',
        uri: `${config.memberApiUrl}/auth`,
        body: {
          email: config.testLogin,
          password: config.testPassword
        },
        json: true,
      }).then((res) => {
        token = res.accessToken;
        done();
      });
    });

    it('user and access token', (done) => {
      request.post('/auth/crms')
        .send({
          token,
        })
        .expect((res) => {
          crms.accessToken = res.body.accessToken;
          assert.match(res.body.accessToken, config.regex.id)
        })
        .expect(200, crms, done);
    });

    it('validation message if no token', (done) => {
      request.post('/auth/crms')
        .send({})
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'FIELD_REQUIRED',
              field: 'token',
              message: 'token is required',
            },
          ],
        }, done);
    });
  });

  describe('Logout', () => {
    it('redirect url', (done) => {
      request.delete(`/auth?accessToken=${global.token}`)
        .expect(200, {redirectUrl: 'http://siteplus.wtf/logout'}, done);
    });
  });

  describe('Login', () => {
    it('access token', (done) => {
      let token;
      request.post('/auth')
        .send({
          email: config.testLogin,
          password: config.testPassword,
          rememberMe: false,
        })
        .expect(200)
        .expect((res) => {
          assert.isObject(res.body);
          assert.property(res.body, 'accessToken');
          assert.match(res.body.accessToken, config.regex.id);

          token = res.body.accessToken;
        })
        .end((err) => {
          global.token = token;
          return done(err);
        });
    });

    it('validation message if email required', (done) => {
      request.post('/auth')
        .send({
          password: config.testPassword,
          rememberMe: false,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'FIELD_REQUIRED',
              field: 'email',
              message: 'Sorry, email is not correct',
            },
          ],
        }, done);
    });

    it('validation message if email is has no valid url', (done) => {
      request.post('/auth')
        .send({
          email: 'test1234@siteplus',
          password: config.testPassword,
          rememberMe: false,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'NOT_VALID',
              field: 'email',
              message: 'Sorry, email is not correct',
            },
          ],
        }, done);
    });

    it('validation message if email is incorrect', (done) => {
      request.post('/auth')
        .send({
          email: 'test1234',
          password: config.testPassword,
          rememberMe: false,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'NOT_VALID',
              field: 'email',
              message: 'Sorry, email is not correct',
            },
          ],
        }, done);
    });

    it('validation message if email has wrong type', (done) => {
      request.post('/auth')
        .send({
          email: 1234,
          password: config.testPassword,
          rememberMe: false,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'BAD_TYPE',
              field: 'email',
              message: 'Sorry, email is not correct',
            },
          ],
        }, done);
    });

    it('validation error if password is too short or simple', (done) => {
      request.post('/auth')
        .send({
          email: config.testLogin,
          password: '1234',
          rememberMe: false,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'NOT_VALID',
              field: 'password',
              message: 'password is not valid',
            },
          ],
        }, done);
    });

    it('validation error if password required', (done) => {
      request.post('/auth')
        .send({
          email: config.testLogin,
          rememberMe: false,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'FIELD_REQUIRED',
              field: 'password',
              message: 'password is required',
            },
          ],
        }, done);
    });

    it('validation error if password has wrong type', (done) => {
      request.post('/auth')
        .send({
          email: config.testLogin,
          password: 12345,
          rememberMe: false,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'BAD_TYPE',
              field: 'password',
              message: 'password has wrong type. It has to be string',
            },
          ],
        }, done);
    });

    it('validation error if rememberMe has wrong type', (done) => {
      request.post('/auth')
        .send({
          email: config.testLogin,
          password: config.testPassword,
          rememberMe: 'yesss',
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'BAD_TYPE',
              field: 'rememberMe',
              message: 'rememberMe has wrong type. It has to be boolean',
            },
          ],
        }, done);
    });

    it('authentication error if email or password invalid', (done) => {
      request.post('/auth')
        .send({
          email: 'user1234@siteplus.com',
          password: '123456',
          rememberMe: false,
        })
        .expect(401, {
          type: 'authentication',
          message: 'Email or password is incorrect.',
        }, done);
    });
  });

  describe('Validate', () => {
    it('account data with accessToken', (done) => {
      const mock = auth.validateAccessToken;

      request.post(`/auth/validate?accessToken=${global.token}`)
        .expect(200)
        .expect((res) => {
          assert.isObject(res.body);

          assert.property(res.body, 'account');
          assert.isObject(res.body.account);
          assert.property(res.body.account, 'settings');
          assert.isArray(res.body.account.settings);
          assert.isNotEmpty(res.body.account.settings);
          mock.account.settings = res.body.account.settings;

          res.body.account.settings.forEach((category) => {
            assert.property(category, 'settingCategoryId');
            assert.isNumber(category.settingCategoryId);
            assert.isAbove(category.settingCategoryId, 0);

            assert.property(category, 'categoryTechnicalName');
            assert.isString(category.categoryTechnicalName);
            assert.match(category.categoryTechnicalName, /^[a-zA-Z0-9\s]+/);

            assert.property(category, 'categoryMarketingName');
            assert.isString(category.categoryMarketingName);
            assert.match(category.categoryMarketingName, /^[a-zA-Z0-9\s]+/);

            assert.property(category, 'settings');
            assert.isArray(category.settings);
            assert.isNotEmpty(category.settings);

            category.settings.forEach((setting) => {
              assert.property(setting, 'settingId');
              assert.isNumber(setting.settingId);
              assert.isAbove(setting.settingId, 0);

              assert.property(setting, 'settingTechnicalName');
              assert.isString(setting.settingTechnicalName);
              assert.match(setting.settingTechnicalName, /^[a-zA-Z0-9\s]+/);

              assert.property(setting, 'settingMarketingName');
              assert.isString(setting.settingMarketingName);
              assert.match(setting.settingMarketingName, /^[a-zA-Z0-9\s]+/);

              assert.property(setting, 'value');
            });
          });

          assert.deepEqual(mock, res.body);
        })
        .end(done);
    });

    it('account data with userId and apiKey', (done) => {
      request.post(`/auth/validate?userId=${config.testUserId}&apiKey=${config.apiKey}`)
        .expect(200, auth.validateApiKey, done);
    });
  });
});

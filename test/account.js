const config = require('./helpers/config');
let request = require('supertest');
request = request(config.serviceUrl);
const uuid = require('uuid/v1');

const {
  account,
} = require('./mocks/index');
const {
  login,
  logout,
} = require('./helpers/hooks');
const {
  assert
} = require('chai');

const testAccountEmail = `testuser_${uuid()}@siteplus.com`;

describe('Account controller', () => {
  after((done) => {
    logout()
      .then(() => {
        return login(config.testLogin, config.testPassword)
      })
      .then(done);
  });

  describe('Get account', () => {
    it('account', (done) => {
      request.get(`/account?accessToken=${global.token}`)
        .expect(200, account.account, done);
    });
  });

  describe('Get account permissions', function() {
    this.timeout(5000);

    it('permissions', (done) => {
      const mock = account.permission;

      request.get(`/account/permission?accessToken=${global.token}`)
        .expect(200)
        .expect((res) => {
          assert.isObject(res.body);

          assert.property(res.body, 'settings');
          assert.isObject(res.body.settings);
          assert.isNotEmpty(res.body.settings);
          mock.settings = res.body.settings;
          for (const settingName in res.body.settings){
            const setting = res.body.settings[settingName];

            assert.property(setting, 'technicalName');
            assert.isString(setting.technicalName);
            assert.match(setting.technicalName, /^[a-zA-Z]+/);

            assert.property(setting, 'marketingName');
            assert.isString(setting.marketingName);
            assert.match(setting.marketingName, /^[a-zA-Z]+/);

            assert.property(setting, 'value');
          }

          mock.settingsCategory = res.body.settingsCategory;

          assert.isArray(res.body.settingsCategory);
          assert.isNotEmpty(res.body.settingsCategory);

          res.body.settingsCategory.forEach((category) => {
            assert.property(category, 'settingCategoryId');
            assert.isString(category.settingCategoryId);

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
              assert.isString(setting.settingId);

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
  });

  describe('Get account editor-capability', () => {
    it('editor-capability', (done) => {
      request.get(`/account/editor-capability?accessToken=${global.token}`)
        .expect(200, account.editorCapability, done);
    });
  });

  describe('Get account plan', () => {
    it('plan', (done) => {
      request.get(`/account/plan?accessToken=${global.token}`)
        .expect(200, account.plan, done);
    });
  });

  describe('Get account plan-upgrade-url', () => {
    it('plan-upgrade-url', (done) => {
      request.get(`/account/plan-upgrade-url?accessToken=${global.token}`)
        .expect(200, account.planUpgradeUrl, done);
    });
  });

  describe('Get account contact', () => {
    it('contact', (done) => {
      request.get(`/account/contact?accessToken=${global.token}`)
        .expect(200, account.contact, done)
    });
  });

  describe('Get account overview', () => {
    it('overview', (done) => {
      const mock = account.overview;

      request.get(`/account/overview?accessToken=${global.token}`)
        .expect(200)
        .expect((res) => {
          assert.isObject(res.body);

          assert.property(res.body, 'used');
          assert.isObject(res.body.used);

          assert.property(res.body.used, 'pages');
          assert.isNumber(res.body.used.pages);
          assert.isAtLeast(res.body.used.pages, 0);
          mock.used.pages = res.body.used.pages;

          assert.property(res.body.used, 'storage');
          assert.isNumber(res.body.used.storage);
          assert.isAtLeast(res.body.used.storage, 0);
          mock.used.storage = res.body.used.storage;

          assert.deepEqual(mock, res.body);
        })
        .end(done);
    });
  });

  describe('Get account notifications', () => {
    it('notifications', (done) => {
      request.get(`/account/notifications?accessToken=${global.token}`)
        .expect(200, account.notifications, done);
    });
  });

  describe('Get account subscriptions', () => {
    it('subscriptions', (done) => {
      request.get(`/account/subscriptions?accessToken=${global.token}`)
        .expect(200, account.subscriptions, done);
    });
  });

  describe('Get account email-notifications', () => {
    it('email-notifications', (done) => {
      request.get(`/account/email-notifications?accessToken=${global.token}`)
        .expect(200, account.emailNotifications, done);
    });
  });

  describe('Get account email-notifications', function () {
    this.timeout(5000);

    it('email-notifications by id', (done) => {
      request.get(`/account/email-notifications/147988?accessToken=${global.token}`)
        .expect(200, done);
    });

  });

  describe('Create account', () => {
    before((done) => {
      logout()
        .then(done);
    });

    after((done) => {
      login(testAccountEmail, config.testPassword)
        .then(done);
    });

    it('new account', (done) => {
      const mock = account.create;

      request.post('/account')
        .send({
          password: config.testPassword,
          fullName: 'Test Test',
          email: testAccountEmail,
        })
        .expect(200)
        .expect((res) => {
          assert.isObject(res.body);

          assert.property(res.body, 'email');
          assert.isString(res.body.email);
          assert.match(res.body.email, config.regex.defaultUserEmail);
          mock.email = res.body.email;

          assert.property(res.body, 'id');
          assert.isNumber(res.body.id);
          assert.isAbove(res.body.id, 0);
          mock.id = res.body.id;

          assert.deepEqual(mock, res.body);
        })
        .end(done);
    });

    it('validation message if email existst', (done) => {
      request.post('/account')
        .send({
          password: config.testPassword,
          fullName: 'Test Test',
          email: config.testLogin,
        })
        .expect(400, {
          type: 'validation',
          message: [
            {
              field: 'email',
              message: 'Account with this email already exists.',
            },
          ],
        }, done);
    });

    it('validation message if email is has no valid url', (done) => {
      request.post('/account')
        .send({
          password: config.testPassword,
          fullName: 'Test Test',
          email: `testuser_${uuid()}@siteplus`,
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
      request.post('/account')
        .send({
          password: config.testPassword,
          fullName: 'Test Test',
          email: `testuser_${uuid()}`,
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

    it('validation message if email is empty', (done) => {
      request.post('/account')
        .send({
          password: config.testPassword,
          fullName: 'Test Test',
          email: '',
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
      request.post('/account')
        .send({
          password: config.testPassword,
          fullName: 'Test Test',
          email: 666,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              field: 'email',
              message: 'Sorry, email is not correct',
              code: 'BAD_TYPE',
            },
          ],
        }, done);
    });

    it('validation message if email is required', (done) => {
      request.post('/account')
        .send({
          password: config.testPassword,
          fullName: 'Test Test',
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

    it('validation message if password is too simple', (done) => {
      request.post('/account')
        .send({
          password: '1234',
          fullName: 'Test Test',
          email: `testuser_${uuid()}@siteplus.com`,
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

    it('validation message if password is empty', (done) => {
      request.post('/account')
        .send({
          password: '',
          fullName: 'Test Test',
          email: `testuser_${uuid()}@siteplus.com`,
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

    it('validation message if password is required', (done) => {
      request.post('/account')
        .send({
          fullName: 'Test Test',
          email: `testuser_${uuid()}@siteplus.com`,
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

    it('validation message if password has wrong type', (done) => {
      request.post('/account')
        .send({
          password: 12345678,
          fullName: 'Test Test',
          email: `testuser_${uuid()}@siteplus.com`,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              field: 'password',
              message: 'password has wrong type. It has to be string',
              code: 'BAD_TYPE',
            },
          ],
        }, done);
    });

    it('validation message if full name is empty', (done) => {
      request.post('/account')
        .send({
          password: config.testPassword,
          fullName: '',
          email: `testuser_${uuid()}@siteplus.com`,
        })
        .expect(400, {
          type: 'validation',
          message: [
            {
              field: 'fullName',
              message: 'Full name cannot be empty.',
            },
          ],
        }, done);
    });

    it('validation message if full name is too short', (done) => {
      request.post('/account')
        .send({
          password: config.testPassword,
          fullName: 'T',
          email: `testuser_${uuid()}@siteplus.com`,
        })
        .expect(400, {
          type: 'validation',
          message: [
            {
              field: 'fullName',
              message: 'Full name require a minimum two characters.',
            },
          ],
        }, done);
    });

    it('validation message if full name is required', (done) => {
      request.post('/account')
        .send({
          password: config.testPassword,
          email: `testuser_${uuid()}@siteplus.com`,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'FIELD_REQUIRED',
              field: 'fullName',
              message: 'fullName is required',
            },
          ],
        }, done);
    });

    it('validation message if full name has wrong type', (done) => {
      request.post('/account')
        .send({
          password: config.testPassword,
          fullName: 123,
          email: `testuser_${uuid()}@siteplus.com`,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              field: 'fullName',
              message: 'fullName has wrong type. It has to be string',
              code: 'BAD_TYPE',
            },
          ],
        }, done);
    });
  });

  describe('Edit account', () => {
    it('empty responce when account changed', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          email: testAccountEmail,
          firstName: 'Test',
          lastName: 'Test',
          contact: account.contact,
          notifications: account.notifications,
          timezone: 90,
          language: 0,
          emailContentType: 0,
        })
        .expect(200, {}, done);
    });

    it('validation message if email alredy in use', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          email: config.testLogin,
        })
        .expect(400, {
          type: 'validation',
          message: [
            {
              field: 'email',
              message: 'This email address is already in use.',
            },
          ],
        }, done);
    });


    it('validation message if email is has no valid url', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          email: `testuser_${uuid()}@siteplus`,
        })
        .expect(400, {
          type: 'validation',
          message: [
            {
              field: 'email',
              message: 'Please enter a real email address.',
            },
          ],
        }, done);
    });

    it('validation message if email is incorrect', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          email: `testuser_${uuid()}`,
        })
        .expect(400, {
          type: 'validation',
          message: [
            {
              field: 'email',
              message: 'Please enter a real email address.',
            },
          ],
        }, done);
    });

    it('validation message if email has wrong type', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          email: 12345,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              field: 'email',
              message: 'Sorry, email is not correct',
              code: 'BAD_TYPE',
            },
          ],
        }, done);
    });

    it('validation message if first name is too short', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          firstName: 'T',
        })
        .expect(400, {
          type: 'validation',
          message: [
            {
              field: 'firstName',
              message: 'Please enter your real first name.',
            },
          ],
        }, done);
    });

    it('validation message if first name has wrong type', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          firstName: 1234,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'BAD_TYPE',
              field: 'firstName',
              message: 'firstName has wrong type. It has to be string',
            },
          ],
        }, done);
    });

    it('validation message if last name has wrong type', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          lastName: 1234,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              field: 'lastName',
              message: 'lastName has wrong type. It has to be string',
              code: 'BAD_TYPE',
            },
          ],
        }, done);
    });

    it('validation message if contact has wrong type', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          contact: 'lorem ipsum',
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              field: 'contact',
              message: 'contact has wrong type. It has to be object',
              code: 'BAD_TYPE',
            },
          ],
        }, done);
    });

    it('validation message if notifications has wrong type', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          notifications: 'lorem ipsum',
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              field: 'notifications',
              message: 'notifications has wrong type. It has to be object',
              code: 'BAD_TYPE',
            },
          ],
        }, done);
    });

    it('validation message if timezone has invalid value', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          timezone: -1,
        })
        .expect(400, {
          type: 'validation',
          message: [
            {
              field: 'timezone',
              message: 'Invalid timezone ID.',
            },
          ],
        }, done);
    });

    it('validation message if timezone has wrong type', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          timezone: 'abcd',
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              field: 'timezone',
              message: 'timezone has wrong type. It has to be number',
              code: 'BAD_TYPE',
            },
          ],
        }, done);
    });

    it('validation message if language has invalid value', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          language: -1,
        })
        .expect(400, {
          type: 'validation',
          message: [
            {
              field: 'language',
              message: 'Invalid language ID.',
            },
          ],
        }, done);
    });

    it('validation message if language has wrong type', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          language: 'abcd',
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              field: 'language',
              message: 'language has wrong type. It has to be number',
              code: 'BAD_TYPE',
            },
          ],
        }, done);
    });

    it('validation message if emailContentType has wrong type', (done) => {
      request.put(`/account?accessToken=${global.token}`)
        .send({
          emailContentType: 'abcd',
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              field: 'emailContentType',
              message: 'emailContentType has wrong type. It has to be number',
              code: 'BAD_TYPE',
            },
          ],
        }, done);
    });
  });

  describe('Edit account contact', () => {
    it('contact', (done) => {
      request.put(`/account/contact?accessToken=${global.token}`)
        .send(account.contact)
        .expect(200, account.contact, done);
    });
  });

  describe('Edit account notifications', () => {
    it('notifications', (done) => {
      request.put(`/account/notifications?accessToken=${global.token}`)
        .send(account.notifications)
        .expect(200, account.notifications, done);
    });
  });

  // TODO: PUT /account/email/confirm
  // https://git01.siteplus.com/SitePlus/member-api/blob/staging/api/v1_1/doc/member_api.md#19-confirm-change-email
  // Need a token

  // TODO: PUT /account/email/verify
  // https://git01.siteplus.com/SitePlus/member-api/blob/staging/api/v1_1/doc/member_api.md#17-email-verification-confirm
  // Need a token

  // TODO: POST /account/email/verify
  // https://git01.siteplus.com/SitePlus/member-api/blob/staging/api/v1_1/doc/member_api.md#16-resend-email-verification

  // TODO: PUT /account/password-reset/
  // https://git01.siteplus.com/SitePlus/member-api/blob/staging/api/v1_1/doc/member_api.md#6-password-reset-confirm
  // Need a token

  describe('Password reset force', () => {
    it('empty responce when password changed', (done) => {
      request.put(`/account/password-reset/force?accessToken=${global.token}`)
        .send({
          password: config.testPassword,
          newPassword: config.testPassword,
        })
        .expect(200, {}, done);
    });

    it('validation message is current password incorrect', (done) => {
      request.put(`/account/password-reset/force?accessToken=${global.token}`)
        .send({
          password: '12345678',
          newPassword: config.testPassword,
        })
        .expect(400, {
          type: 'validation',
          message: [
            {
              field: 'password',
              message: 'Current password is incorrect.',
            },
          ],
        }, done);
    });

    it('validation message is current password empty', (done) => {
      request.put(`/account/password-reset/force?accessToken=${global.token}`)
        .send({
          password: '',
          newPassword: config.testPassword,
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

    it('validation message is current password has wrong type', (done) => {
      request.put(`/account/password-reset/force?accessToken=${global.token}`)
        .send({
          password: 1234,
          newPassword: config.testPassword,
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

    it('validation is current password required', (done) => {
      request.put(`/account/password-reset/force?accessToken=${global.token}`)
        .send({
          newPassword: config.testPassword,
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

    it('validation message is new password is too short', (done) => {
      request.put(`/account/password-reset/force?accessToken=${global.token}`)
        .send({
          password: config.testPassword,
          newPassword: '12345',
        })
        .expect(400, {
          type: 'validation',
          message: [
            {
              field: 'newPassword',
              message: 'New password must be at least 8 valid characters.',
            },
          ],
        }, done);
    });

    it('validation message is new password empty', (done) => {
      request.put(`/account/password-reset/force?accessToken=${global.token}`)
        .send({
          password: config.testPassword,
          newPassword: '',
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'NOT_VALID',
              field: 'newPassword',
              message: 'newPassword is not valid',
            },
          ],
        }, done);
    });

    it('validation is new password required', (done) => {
      request.put(`/account/password-reset/force?accessToken=${global.token}`)
        .send({
          password: config.testPassword,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'FIELD_REQUIRED',
              field: 'newPassword',
              message: 'newPassword is required',
            },
          ],
        }, done);
    });


    it('validation message is new password has wrong type', (done) => {
      request.put(`/account/password-reset/force?accessToken=${global.token}`)
        .send({
          password: config.testPassword,
          newPassword: 1234,
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              field: 'newPassword',
              message: 'newPassword has wrong type. It has to be string',
              code: 'BAD_TYPE',
            },
          ],
        }, done);
    });
  });
});

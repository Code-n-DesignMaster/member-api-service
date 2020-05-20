const config = require('./helpers/config');
let request = require('supertest');
request = request(config.serviceUrl);

const {
  assert,
} = require('chai');
const {
  sessions,
} = require('./mocks/index');

describe('Session controller', () => {

  describe('List sessions', () => {
    it('list', (done) => {
      request.get(`/sessions?accessToken=${global.token}`)
        .expect(200)
        .expect((res) => {
          assert.isObject(res.body);

          assert.property(res.body, 'offset');
          assert.isNumber(res.body.offset);

          assert.property(res.body, 'limit');
          assert.isNumber(res.body.limit);

          assert.property(res.body, 'count');
          assert.isNumber(res.body.count);

          assert.property(res.body, 'data');
          assert.isArray(res.body.data);
          res.body.data.forEach((session) => {
            assert.property(session, '_id');
            assert.match(session._id, config.regex.id);

            assert.property(session, 'updatedAt');
            assert.match(session.updatedAt, config.regex.date);

            assert.property(session, 'ipAddress');
            assert.match(session.ipAddress, /^(::[a-zA-Z0-9]{4}:)?\d{2,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

            assert.property(session, 'metadata');
            assert.isObject(session.metadata);

            assert.nestedProperty(session, 'metadata.country');
            assert.match(session.metadata.country, /^([A-Z]{2})|(Unknown)/);

            assert.nestedProperty(session, 'metadata.userAgent');
            assert.isObject(session.metadata.userAgent);

            assert.nestedProperty(session, 'metadata.userAgent.source');
            assert.isString(session.metadata.userAgent.source);

            assert.nestedProperty(session, 'metadata.userAgent.platform');
            assert.isString(session.metadata.userAgent.platform);

            assert.nestedProperty(session, 'metadata.userAgent.version');
            assert.isString(session.metadata.userAgent.version);

            assert.nestedProperty(session, 'metadata.userAgent.browser');
            assert.isString(session.metadata.userAgent.browser);

            assert.property(session, 'online');
            assert.isBoolean(session.online);
          });
        })
        .end(done);
    });
  });

  describe('delete session', () => {
    it('200 OK', (done) => {
      request.delete(`/sessions/test_session_id_here?accessToken=${global.token}`)
        .expect(200, done);
    });
  });
});

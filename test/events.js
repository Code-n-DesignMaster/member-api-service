const config = require('./helpers/config');
let request = require('supertest');
request = request(config.serviceUrl);

describe('Events controller', () => {
  describe('Validation test', () => {
    it('message if invalid type format', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'invalid type here',
          payload: { memberId: config.eventsTest.testUserId },
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'NOT_VALID',
              field: 'type',
              message: 'type is not valid',
            },
          ],
        }, done);
    });

    it('message if ivalid api key', (done) => {
      request.post('/events/?apiKey=1234')
        .send({
          type: 'member:statusChanged',
          payload: { memberId: config.eventsTest.testUserId },
        })
        .expect(403, {
          type: 'authentication',
          message: 'Not authenticated',
        }, done);
    });

    it('message if ivalid member id', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'member:statusChanged',
          payload: { memberId: 1234 },
        })
        .expect(401, {
          type: 'authentication',
          message: 'Invalid access token',
        }, done);
    });

    it('message if member ID not passed', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'member:statusChanged',
          payload: {},
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'FIELD_REQUIRED',
              field: 'memberId',
              message: 'memberId is required',
            },
          ],
        }, done);
    });

    it('message if member ID has wrong type', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'member:statusChanged',
          payload: { memberId: 'foo' },
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'BAD_TYPE',
              field: 'memberId',
              message: 'memberId has wrong type. It has to be number',
            },
          ],
        }, done);
    });

    it('message if product ID has wrong type', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'member:statusChanged',
          payload: {
            memberId: config.eventsTest.testUserId,
            productId: 'bar',
          },
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'BAD_TYPE',
              field: 'productId',
              message: 'productId has wrong type. It has to be number',
            },
          ],
        }, done);
    });
  });

  describe('Member events test', () => {
    it('pendingStatus empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'member:pendingStatus',
          payload: { memberId: config.eventsTest.testUserId },
        })
        .expect(200, {}, done);
    });

    it('activeStatus empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'member:activeStatus',
          payload: { memberId: config.eventsTest.testUserId },
        })
        .expect(200, {}, done);
    });

    it('suspendedStatus empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'member:suspendedStatus',
          payload: { memberId: config.eventsTest.testUserId },
        })
        .expect(200, {}, done);
    });

    it('terminatedStatus empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'member:terminatedStatus',
          payload: { memberId: config.eventsTest.testUserId },
        })
        .expect(200, {}, done);
    });

    it('archivedStatus empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'member:archivedStatus',
          payload: { memberId: config.eventsTest.testUserId },
        })
        .expect(200, {}, done);
    });

    it('created empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'member:created',
          payload: { memberId: config.eventsTest.testUserId },
        })
        .expect(200, {}, done);
    });

    it('updated empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'member:updated',
          payload: { memberId: config.eventsTest.testUserId },
        })
        .expect(200, {}, done);
    });
  });

  describe('Subscription events test', () => {
    it('installed empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'subscription:installed',
          payload: {
            memberId: config.eventsTest.testUserId,
          },
        })
        .expect(200, {}, done);
    });

    it('migrated empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'subscription:migrated',
          payload: {
            memberId: config.eventsTest.testUserId,
            productId: 72492
          },
        })
        .expect(200, {}, done);
    });

    it('renewed empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'subscription:renewed',
          payload: {
            memberId: config.eventsTest.testUserId,
          },
        })
        .expect(200, {}, done);
    });

    it('statusChanged empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'subscription:statusChanged',
          payload: {
            memberId: config.eventsTest.testUserId,
          },
        })
        .expect(200, {}, done);
    });

    it('activeStatus empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'subscription:activeStatus',
          payload: {
            memberId: config.eventsTest.testUserId,
            productId: 72492
          },
        })
        .expect(200, {}, done);
    });

    it('suspendedStatus empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'subscription:suspendedStatus',
          payload: {
            memberId: config.eventsTest.testUserId,
            productId: 72492
          },
        })
        .expect(200, {}, done);
    });

    it('terminatedStatus empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'subscription:terminatedStatus',
          payload: {
            memberId: config.eventsTest.testUserId,
            productId: 72492
          },
        })
        .expect(200, {}, done);
    });

    it('renewal_dueStatus empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'subscription:renewal_dueStatus',
          payload: {
            memberId: config.eventsTest.testUserId,
            productId: 72492
          },
        })
        .expect(200, {}, done);
    });

    it('expiredStatus empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'subscription:expiredStatus',
          payload: {
            memberId: config.eventsTest.testUserId,
            productId: 72492
          },
        })
        .expect(200, {}, done);
    });

    it('archivedStatus empty responce', (done) => {
      request.post(`/events/?apiKey=${config.apiKey}`)
        .send({
          type: 'subscription:archivedStatus',
          payload: {
            memberId: config.eventsTest.testUserId,
            productId: 72492
          },
        })
        .expect(200, {}, done);
    });
  });

  describe('Hosting events test', () => {
    describe('validation fields test', () => {
      it('message if required field productId unavailable', (done) => {
        request.post(`/events/?apiKey=${config.apiKey}`)
          .send({
            type: 'hosting:updated',
            payload: {
              memberId: config.eventsTest.testUserId,
              resellerId: 1,
              hostingId: 491,
              // productId: 2168,
              host: '129.168.1.1',
              port: 22,
              username: 'user',
              password: 'realpassword',
              rootFolder: 'public_html',
              publishTransferProtocol: 'sftp',
              loginUrl: 'https:\/\/siteplus.wtf',
              logoutUrl: 'https:\/\/siteplus.wtf',
              parkedType: 'basic',
            },
          })
          .expect(500, {
            type: 'system',
            message: 'Internal Server Error'
          }, done);
      });

      it('message if required field host unavailable', (done) => {
        request.post(`/events/?apiKey=${config.apiKey}`)
          .send({
            type: 'hosting:updated',
            payload: {
              memberId: config.eventsTest.testUserId,
              resellerId: 1,
              hostingId: 491,
              productId: 2168,
              // host: '129.168.1.1',
              port: 22,
              username: 'user',
              password: 'realpassword',
              rootFolder: 'public_html',
              publishTransferProtocol: 'sftp',
              loginUrl: 'https:\/\/siteplus.wtf',
              logoutUrl: 'https:\/\/siteplus.wtf',
              parkedType: 'basic',
            },
          })
          .expect(500, {
            type: 'system',
            message: 'Internal Server Error'
          }, done);
      });

      it('message if required field username unavailable', (done) => {
        request.post(`/events/?apiKey=${config.apiKey}`)
          .send({
            type: 'hosting:updated',
            payload: {
              memberId: config.eventsTest.testUserId,
              resellerId: 1,
              hostingId: 491,
              productId: 2168,
              host: '129.168.1.1',
              port: 22,
              // username: 'user',
              password: 'realpassword',
              rootFolder: 'public_html',
              publishTransferProtocol: 'sftp',
              loginUrl: 'https:\/\/siteplus.wtf',
              logoutUrl: 'https:\/\/siteplus.wtf',
              parkedType: 'basic',
            },
          })
          .expect(500, {
            type: 'system',
            message: 'Internal Server Error'
          }, done);
      });

      it('message if required field password unavailable', (done) => {
        request.post(`/events/?apiKey=${config.apiKey}`)
          .send({
            type: 'hosting:updated',
            payload: {
              memberId: config.eventsTest.testUserId,
              resellerId: 1,
              hostingId: 491,
              productId: 2168,
              host: '129.168.1.1',
              port: 22,
              username: 'user',
              // password: 'realpassword',
              rootFolder: 'public_html',
              publishTransferProtocol: 'sftp',
              loginUrl: 'https:\/\/siteplus.wtf',
              logoutUrl: 'https:\/\/siteplus.wtf',
              parkedType: 'basic',
            },
          })
          .expect(500, {
            type: 'system',
            message: 'Internal Server Error'
          }, done);
      });

      it('message if required field rootFolder unavailable', (done) => {
        request.post(`/events/?apiKey=${config.apiKey}`)
          .send({
            type: 'hosting:updated',
            payload: {
              memberId: config.eventsTest.testUserId,
              resellerId: 1,
              hostingId: 491,
              productId: 2168,
              host: '129.168.1.1',
              port: 22,
              username: 'user',
              password: 'realpassword',
              // rootFolder: 'public_html',
              publishTransferProtocol: 'sftp',
              loginUrl: 'https:\/\/siteplus.wtf',
              logoutUrl: 'https:\/\/siteplus.wtf',
              parkedType: 'basic',
            },
          })
          .expect(500, {
            type: 'system',
            message: 'Internal Server Error'
          }, done);
      });

      it('message if required field resellerId unavailable', (done) => {
        request.post(`/events/?apiKey=${config.apiKey}`)
          .send({
            type: 'hosting:updated',
            payload: {
              memberId: config.eventsTest.testUserId,
              // resellerId: 1,
              hostingId: 491,
              productId: 2168,
              host: '129.168.1.1',
              port: 22,
              username: 'user',
              password: 'realpassword',
              rootFolder: 'public_html',
              publishTransferProtocol: 'sftp',
              loginUrl: 'https:\/\/siteplus.wtf',
              logoutUrl: 'https:\/\/siteplus.wtf',
              parkedType: 'basic',
            },
          })
          .expect(500, {
            type: 'system',
            message: 'Internal Server Error'
          }, done);
      });

      it('message if required field loginUrl unavailable', (done) => {
        request.post(`/events/?apiKey=${config.apiKey}`)
          .send({
            type: 'hosting:updated',
            payload: {
              memberId: config.eventsTest.testUserId,
              resellerId: 1,
              hostingId: 491,
              productId: 2168,
              host: '129.168.1.1',
              port: 22,
              username: 'user',
              password: 'realpassword',
              rootFolder: 'public_html',
              publishTransferProtocol: 'sftp',
              // loginUrl: 'https:\/\/siteplus.wtf',
              logoutUrl: 'https:\/\/siteplus.wtf',
              parkedType: 'basic',
            },
          })
          .expect(500, {
            type: 'system',
            message: 'Internal Server Error'
          }, done);
      });
    });

    describe('change status test', () => {
      it('created status empty respnoce', (done) => {
        request.post(`/events/?apiKey=${config.apiKey}`)
          .send({
            type: 'hosting:created',
            payload: {
              memberId: config.eventsTest.testUserId,
              resellerId: 1,
              hostingId: 491,
              productId: 2168,
              host: '129.168.1.1',
              port: 22,
              username: 'user',
              password: 'realpassword',
              rootFolder: 'public_html',
              publishTransferProtocol: 'sftp',
              loginUrl: 'https:\/\/siteplus.wtf',
              logoutUrl: 'https:\/\/siteplus.wtf',
              parkedType: 'basic',
            },
          })
          .expect(200, {}, done);
      });

      it('updated status empty respnoce', (done) => {
        request.post(`/events/?apiKey=${config.apiKey}`)
          .send({
            type: 'hosting:updated',
            payload: {
              memberId: config.eventsTest.testUserId,
              resellerId: 1,
              hostingId: 491,
              productId: 2168,
              host: '129.168.1.1',
              port: 22,
              username: 'user',
              password: 'realpassword',
              rootFolder: 'public_html',
              publishTransferProtocol: 'sftp',
              loginUrl: 'https:\/\/siteplus.wtf',
              logoutUrl: 'https:\/\/siteplus.wtf',
              parkedType: 'basic',
            },
          })
          .expect(200, {}, done);
      });
    });
  });
});

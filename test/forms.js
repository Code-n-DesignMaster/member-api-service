const config = require('./helpers/config');
let request = require('supertest');
request = request(config.serviceUrl);

describe('Forms controller', () => {

  describe('Send form', () => {
    it('empty responce', (done) => {
      request.post('/forms/a3e417cb-ee20-4d3e-8eea-7c45ffdd3eec')
        .send({
          data: [
            {
              key: '523946e19f134542',
              value: 'Test',
            },
            {
              key: '5b304d46d052d701',
              value: 'Test',
            },
            {
              key: 'db051f13b5239e4f',
              value: 'test@siteplus.com',
            },
            {
              key: 'da08c5a5033f6af0',
              value: '+38044102',
            },
            {
              key: 'a0141e21f1fb3955',
              value: 'It message from integration test of member-api-service',
            },
          ],
          formName: 'Marketing v3 - Home',
          hash: 'e7395b7d6f9dcd27',
          page: 'e056ae62-78b1-4c3b-a76f-96308500ffd2',
        })
        .expect(200, {}, done);
    });
  });

  describe('Validation test', () => {
    it('validation message if form data not array', (done) => {
      request.post('/forms/a3e417cb-ee20-4d3e-8eea-7c45ffdd3eec')
        .send({
          data: 1234,
          formName: 'Marketing v3 - Home',
          hash: 'e7395b7d6f9dcd27',
          page: 'e056ae62-78b1-4c3b-a76f-96308500ffd2',
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'BAD_TYPE',
              field: 'data',
              message: 'data has wrong type. It has to be array',
            },
          ],
        }, done);
    });

    it('validation message if project id has invalid symbols', (done) => {
      request.post('/forms/&**#^^&&*@')
        .send({
          data: [
            {
              key: '523946e19f134542',
              value: 'Test',
            },
            {
              key: '5b304d46d052d701',
              value: 'Test',
            },
            {
              key: 'db051f13b5239e4f',
              value: 'test@siteplus.com',
            },
            {
              key: 'da08c5a5033f6af0',
              value: '+38044102',
            },
            {
              key: 'a0141e21f1fb3955',
              value: 'It message from integration test of member-api-service',
            },
          ],
          formName: 'Marketing v3 - Home',
          hash: 'e7395b7d6f9dcd27',
          page: 'e056ae62-78b1-4c3b-a76f-96308500ffd2',
        })
        .expect(400, {
          type: 'validation',
          messages: [
            {
              code: 'NOT_VALID',
              field: 'projectId',
              message: 'projectId is not valid',
            },
          ],
        }, done);
    });
  });

});

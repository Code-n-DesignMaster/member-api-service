const rp = require('request-promise');
const config = require('./helpers/config');
let request = require('supertest');
request = request(config.serviceUrl);

const {
  assert,
} = require('chai');
const {
  projects,
} = require('./mocks/index');

let testProjectId;

describe('Projects controller', () => {
  after((done) => {
    rp({
      method: 'PUT',
      uri: `${config.serviceUrl}/projects/${testProjectId}/delete`,
      headers: {
        Authorization: `Bearer ${global.token}`,
      },
    })
      .then(() => {
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  describe('Get projects', () => {
    const mock = projects.projects;

    it('projects list', (done) => {
      request.get(`/projects?accessToken=${global.token}`)
        .expect(200)
        .expect((res) => {
          assert.isArray(res.body);

          res.body.forEach((project) => {
            assert.isObject(project);

            assert.property(project, 'deleted');
            assert.isBoolean(project.deleted);

            if(project.deleted === false){
              assert.property(project, 'outOfPlan');
              assert.isBoolean(project.outOfPlan);
            }

            assert.property(project, 'published');
            assert.isBoolean(project.published);
            assert.property(project, 'hasChanges');
            assert.isBoolean(project.hasChanges);

            assert.isObject(project.favicon);

            assert.property(project.favicon, ('background'));
            assert.match(project.favicon.background, /^#[A-Za-z0-9]{3,6}/);

            assert.property(project.favicon, ('src'));
            assert.match(project.favicon.src, config.regex.url);

            assert.property(project, ('_id'));
            assert.match(project._id, config.regex.id);

            assert.property(project, 'template');
            assert.isObject(project.template);

            assert.property(project.template, 'src');
            assert.match(project.template.src, config.regex.templateSrc);

            assert.property(project, 'screenshotsDone');
            assert.isBoolean(project.screenshotsDone);

            assert.property(project, 'name');
            assert.isString(project.name);

            assert.property(project, 'num');
            assert.isNumber(project.num);
            assert.isAbove(project.num, 0);

            assert.property(project, 'link');
            assert.match(project.link, config.regex.siteplusSubUrl);

            assert.property(project, 'ssl');
            assert.isBoolean(project.ssl);
          });
        })
        .end((err) => {
          if (err) {
            return done(err);
          }

          done();
        });
    });
  });

  describe('Get one project', () => {
    const mock = projects.project;

    it('project', (done) => {
      request.get(`/projects/a3e417cb-ee20-4d3e-8eea-7c45ffdd3eec?accessToken=${global.token}`)
        .expect(200)
        .expect((res) => {
          assert.isObject(res.body);

          assert.property(res.body, 'publishedAt');
          assert.match(res.body.publishedAt, config.regex.date);
          mock.publishedAt = res.body.publishedAt;

          assert.property(res.body, 'hasChanges');
          assert.isBoolean(res.body.hasChanges);
          mock.hasChanges = res.body.hasChanges;

          assert.property(res.body, 'hasChangesAt');
          assert.match(res.body.hasChangesAt, config.regex.date);
          mock.hasChangesAt = res.body.hasChangesAt;

          assert.deepEqual(mock, res.body);
        })
        .end(done);
    });
  });

  describe('Get project published', () => {
    const mock = projects.published;
    it('project published', (done) => {
      request.get(`/projects/a3e417cb-ee20-4d3e-8eea-7c45ffdd3eec/published?accessToken=${global.token}`)
        .expect(200)
        .expect((res) => {
          assert.isObject(res.body);

          assert.property(res.body, 'assetsVersion');
          assert.match(res.body.assetsVersion, /^\d+/);
          mock.assetsVersion = res.body.assetsVersion;

          assert.deepEqual(mock, res.body);
        })
        .end(done);
    });
  });

  describe('Get project build', () => {
    it('project build', (done) => {
      const mock = projects.build;
      request.get(`/projects/a3e417cb-ee20-4d3e-8eea-7c45ffdd3eec/build?accessToken=${global.token}`)
        .expect(200)
        .expect((res) => {
          assert.isObject(res.body);

          assert.property(res.body, 'hasChanges');
          assert.isBoolean(res.body.hasChanges);
          mock.hasChanges= res.body.hasChanges;

          assert.property(res.body, 'hasChangesAt');
          assert.match(res.body.hasChangesAt, config.regex.date);
          mock.hasChangesAt= res.body.hasChangesAt;

          assert.property(res.body, 'publishedAt');
          assert.match(res.body.publishedAt, config.regex.date);
          mock.publishedAt= res.body.publishedAt;

          assert.property(res.body, 'domains');
          assert.isArray(res.body.domains);
          res.body.domains.forEach((domain) => {
            assert.isObject(domain);

            assert.property(domain, 'updatedAt');
            assert.match(domain.updatedAt, config.regex.date);

            assert.property(domain, 'createdAt');
            assert.match(domain.createdAt, config.regex.date);

            assert.property(domain, 'verificationHash');
            assert.match(domain.verificationHash, /^[a-zA-Z0-9]{16}/);

            assert.property(domain, 'name');
            assert.isString(domain.name);

            assert.property(domain, 'project');
            assert.match(domain.project, config.regex.id);

            assert.property(domain, 'userId');
            assert.match(domain.userId, /^[0-9]+/);

            assert.property(domain, 'verificationAttempt');
            assert.isNumber(domain.verificationAttempt);

            assert.property(domain, 'isVerified');
            assert.isBoolean(domain.isVerified);

            assert.property(domain, 'isPrimary');
            assert.isBoolean(domain.isPrimary);

            assert.property(domain, 'ssl');
            assert.isBoolean(domain.ssl);

            assert.property(domain, 'useWWW');
            assert.isBoolean(domain.useWWW);

            assert.property(domain, 'type');
            assert.isString(domain.type);

            assert.property(domain, 'newNameReservedAt');
            assert.isNull(domain.newNameReservedAt);

            assert.property(domain, 'newName');
            assert.isNull(domain.newName);

            assert.property(domain, '__v');
            assert.isNumber(domain.__v);

            assert.property(domain, 'domainId');
            assert.match(domain.domainId, config.regex.id);

            assert.property(domain, 'link');
            assert.match(domain.link, config.regex.siteplusSubUrl);
          });
          mock.domains = res.body.domains;

          assert.property(res.body, 'eCommerce');
          assert.isObject(res.body.eCommerce);

          assert.property(res.body.eCommerce, 'ecwid_sso_profile');
          assert.match(res.body.eCommerce.ecwid_sso_profile, config.regex.ecwid_sso_profile);
          mock.eCommerce.ecwid_sso_profile = res.body.eCommerce.ecwid_sso_profile;

          assert.property(res.body.eCommerce, 'ecwid_sso_admin_panel_url');
          assert.match(res.body.eCommerce.ecwid_sso_admin_panel_url, config.regex.ecwid_sso_admin_panel_url);
          mock.eCommerce.ecwid_sso_admin_panel_url = res.body.eCommerce.ecwid_sso_admin_panel_url;

          assert.deepEqual(mock, res.body);
        })
        .end(done);
    });
  });

  describe('Get project build for api', () => {
    it('project build', (done) => {
      const mock = projects.buildApi;
      request
        .get(`/projects/a3e417cb-ee20-4d3e-8eea-7c45ffdd3eec/build-api?userId=${config.testUserId}&accessToken=${global.token}`)
        .expect(200)
        .expect((res) => {
          assert.isObject(res.body);

          assert.property(res.body, 'hasChanges');
          assert.isBoolean(res.body.hasChanges);
          mock.hasChanges= res.body.hasChanges;

          assert.property(res.body, 'hasChangesAt');
          assert.match(res.body.hasChangesAt, config.regex.date);
          mock.hasChangesAt= res.body.hasChangesAt;

          assert.property(res.body, 'publishedAt');
          assert.match(res.body.publishedAt, config.regex.date);
          mock.publishedAt= res.body.publishedAt;

          assert.property(res.body, 'domains');
          assert.isArray(res.body.domains);
          res.body.domains.forEach((domain) => {
            assert.isObject(domain);

            assert.property(domain, 'updatedAt');
            assert.match(domain.updatedAt, config.regex.date);

            assert.property(domain, 'createdAt');
            assert.match(domain.createdAt, config.regex.date);

            assert.property(domain, 'verificationHash');
            assert.match(domain.verificationHash, /^[a-zA-Z0-9]{16}/);

            assert.property(domain, 'name');
            assert.isString(domain.name);

            assert.property(domain, 'project');
            assert.match(domain.project, config.regex.id);

            assert.property(domain, 'userId');
            assert.match(domain.userId, /^[0-9]+/);

            assert.property(domain, 'verificationAttempt');
            assert.isNumber(domain.verificationAttempt);

            assert.property(domain, 'isVerified');
            assert.isBoolean(domain.isVerified);

            assert.property(domain, 'isPrimary');
            assert.isBoolean(domain.isPrimary);

            assert.property(domain, 'ssl');
            assert.isBoolean(domain.ssl);

            assert.property(domain, 'useWWW');
            assert.isBoolean(domain.useWWW);

            assert.property(domain, 'type');
            assert.isString(domain.type);

            assert.property(domain, 'newNameReservedAt');
            assert.isNull(domain.newNameReservedAt);

            assert.property(domain, 'newName');
            assert.isNull(domain.newName);

            assert.property(domain, '__v');
            assert.isNumber(domain.__v);

            assert.property(domain, 'domainId');
            assert.match(domain.domainId, config.regex.id);

            assert.property(domain, 'link');
            assert.match(domain.link, config.regex.siteplusSubUrl);
          });
          mock.domains = res.body.domains;

          assert.property(res.body, 'eCommerce');
          assert.isObject(res.body.eCommerce);

          assert.property(res.body.eCommerce, 'ecwid_sso_profile');
          assert.match(res.body.eCommerce.ecwid_sso_profile, config.regex.ecwid_sso_profile);
          mock.eCommerce.ecwid_sso_profile = res.body.eCommerce.ecwid_sso_profile;

          assert.property(res.body.eCommerce, 'ecwid_sso_admin_panel_url');
          assert.match(res.body.eCommerce.ecwid_sso_admin_panel_url, config.regex.ecwid_sso_admin_panel_url);
          mock.eCommerce.ecwid_sso_admin_panel_url = res.body.eCommerce.ecwid_sso_admin_panel_url;

          assert.deepEqual(mock, res.body);
        })
        .end(done);
    });
  });

  describe('Update project ecommerce', () => {
    it('ecommerce', (done) => {
      request.put(`/projects/ecommerce/a3e417cb-ee20-4d3e-8eea-7c45ffdd3eec?apiKey=${config.apiKey}`)
        .expect(200, projects.ecommerce, done);
    });
  });

  describe('Create projects', function() {
    this.timeout(5000);

    it('project id', (done) => {
      const project = {
        outOfPlan: false,
      };

      request.post(`/projects?accessToken=${global.token}`)
        .send({
          templateId: '5fc009db-8a26-408d-bfdf-8c9f9f2ad30d',
        })
        .expect(200)
        .expect((res) => {
          assert.isObject(res.body);

          assert.property(res.body, 'outOfPlan');
          assert.isBoolean(res.body.outOfPlan);

          assert.property(res.body, '_id');
          assert.match(res.body._id, config.regex.id);

          testProjectId = res.body._id;
        })
        .end(done);
    });
  });

  describe('Edit project name', () => {
    it('number of modifed project', (done) => {

      request.put(`/projects/${testProjectId}?accessToken=${global.token}`)
        .send({
          name: 'Test Project',
        })
        .expect(200)
        .expect((res) => {
          assert.isObject(res.body);

          assert.property(res.body, 'num');
          assert.isNumber(res.body.num);
        })
        .end(done);
    });
  });

  describe('Delete project', () => {
    it('empty responce', (done) => {
      request.put(`/projects/${testProjectId}/delete?accessToken=${global.token}`)
        .expect(200, {}, done);
    });
  });

  describe('Undelete project', () => {
    it('empty responce', (done) => {
      request.put(`/projects/${testProjectId}/undelete?accessToken=${global.token}`)
        .expect(200, {}, done);
    });
  });

  describe('Delete project ecommerce', () => {
    it('empty responce', (done) => {
      request.delete(`/projects/ecommerce-publish/${testProjectId}?apiKey=${config.apiKey}`)
        .expect(200, {}, done);
    });
  });

  describe('Publish project', function () {
    this.timeout(5000);

    it('project type', (done) => {
      request.put(`/projects/${testProjectId}/publish?accessToken=${global.token}`)
        .expect(200, projects.publish, done);
    });
  });

  describe('Unpublish project', () => {
    it('empty responce', (done) => {
      request.put(`/projects/${testProjectId}/unpublish?accessToken=${global.token}`)
        .expect(200, {}, done);
    });
  });


  describe('Clone project', function() {
    this.timeout(5000);
    const mock = projects.clone;

    after((done) => {
      rp({
        method: 'PUT',
        uri: `${config.serviceUrl}/projects/${mock._id}/delete`,
        headers: {
          Authorization: `Bearer ${global.token}`,
        },
      })
        .then(() => {
          done();
        });
    });


    it('project', (done) => {
      request.post(`/projects/a3e417cb-ee20-4d3e-8eea-7c45ffdd3eec/clone?accessToken=${global.token}`)
        .expect((res) => {
          assert.isObject(res.body);

          assert.property(res.body, '_id');
          assert.match(res.body._id, config.regex.id);
          mock._id = res.body._id;

          assert.property(res.body, 'updatedAt');
          assert.match(res.body.updatedAt, config.regex.date);
          mock.updatedAt = res.body.updatedAt;

          assert.property(res.body, 'createdAt');
          assert.match(res.body.createdAt, config.regex.date);
          mock.createdAt = res.body.createdAt;

          assert.property(res.body, 'link');
          assert.match(res.body.link, config.regex.siteplusSubUrl);
          mock.link = res.body.link;

          assert.property(res.body, 'projectTemplate');
          assert.match(res.body.projectTemplate, config.regex.id);
          mock.projectTemplate = res.body.projectTemplate;

          assert.property(res.body, 'num');
          assert.isNumber(res.body.num);
          mock.num = res.body.num;

          assert.property(res.body, 'hasChangesAt');
          assert.match(res.body.hasChangesAt, config.regex.date);
          mock.hasChangesAt = res.body.hasChangesAt;

          assert.property(res.body, 'hasChanges');
          assert.isBoolean(res.body.hasChanges);
          mock.hasChanges = res.body.hasChanges;

          assert.property(res.body, 'screenshotsDone');
          assert.isBoolean(res.body.screenshotsDone);
          mock.screenshotsDone = res.body.screenshotsDone;

          assert.property(res.body, 'screenshotUrlTemplate');
          assert.match(res.body.screenshotUrlTemplate, config.regex.imageApiSrc);
          mock.screenshotUrlTemplate = res.body.screenshotUrlTemplate;

          assert.property(res.body, 'template');
          assert.isObject(res.body.template);

          assert.property(res.body.template, 'src');
          assert.match(res.body.template.src, config.regex.url);
          mock.template.src = res.body.template.src;

          assert.property(res.body, 'domains');
          assert.isArray(res.body.domains);
          res.body.domains.forEach((domain) => {
            assert.isObject(domain);

            assert.property(domain, 'updatedAt');
            assert.match(domain.updatedAt, config.regex.date);

            assert.property(domain, 'createdAt');
            assert.match(domain.createdAt, config.regex.date);

            assert.property(domain, 'verificationHash');
            assert.match(domain.verificationHash, /^[a-zA-Z0-9]{16}/);

            assert.property(domain, 'name');
            assert.isString(domain.name);

            assert.property(domain, 'project');
            assert.match(domain.project, config.regex.id);

            assert.property(domain, 'userId');
            assert.match(domain.userId, /^[0-9]+/);

            assert.property(domain, 'verificationAttempt');
            assert.isNumber(domain.verificationAttempt);

            assert.property(domain, 'isVerified');
            assert.isBoolean(domain.isVerified);

            assert.property(domain, 'isPrimary');
            assert.isBoolean(domain.isPrimary);

            assert.property(domain, 'ssl');
            assert.isBoolean(domain.ssl);

            assert.property(domain, 'useWWW');
            assert.isBoolean(domain.useWWW);

            assert.property(domain, 'type');
            assert.isString(domain.type);

            assert.property(domain, 'newNameReservedAt');
            assert.isNull(domain.newNameReservedAt);

            assert.property(domain, 'newName');
            assert.isNull(domain.newName);

            assert.property(domain, '__v');
            assert.isNumber(domain.__v);

            assert.property(domain, 'domainId');
            assert.match(domain.domainId, config.regex.id);

            assert.property(domain, 'link');
            assert.match(domain.link, config.regex.siteplusSubUrl);
          });
          mock.domains = res.body.domains;

          assert.deepEqual(mock, res.body);
        })
        .end(done);
    });
  });

  // TODO: PUT /projects/:id/published
  // Maybe it not used

  describe('Update published project', function() {
    this.timeout(5000);

    it('project type', (done) => {
      request.put(`/projects/${testProjectId}/update?accessToken=${global.token}`)
        .expect(200, projects.publish, done);
    });
  });

  describe('Create project with dify', function() {
    this.timeout(5000);

    before((done) => {
      rp({
        method: 'PUT',
        uri: `${config.serviceUrl}/projects/${testProjectId}/delete`,
        headers: {
          Authorization: `Bearer ${global.token}`,
        },
      })
        .then(() => {
          done();
        });
    });

    it('project id', (done) => {
      const project = {
        outOfPlan: false,
      };

      request.post(`/projects/create-dify?apiKey=${config.apiKey}`)
        .send({
          templateId: '5fc009db-8a26-408d-bfdf-8c9f9f2ad30d',
          dify: {
            memberId: config.testUserId,
            payload: {
              businessAddress: 'Martin Pl 1',
              businessName: 'title',
              city: 'Sydney',
              state: 'NSW',
              country : 'Australia',
              postcode: '2000',
              copyright: '{}',
              validMapAddress: 'Martin Pl 1',
            },
          },
        })
        .expect(200)
        .expect((res) => {
          assert.isObject(res.body);

          assert.property(res.body, 'outOfPlan');
          assert.isBoolean(res.body.outOfPlan);

          assert.property(res.body, '_id');
          assert.match(res.body._id, config.regex.id);

          testProjectId = res.body._id;
        })
        .end(done);
    });
  });

  describe('Publish project with dify', function () {
    this.timeout(5000);

    it('project type', (done) => {
      request.post(`/projects/${testProjectId}/publish-dify?apiKey=${config.apiKey}`)
        .send({
          dify: {
            memberId: config.testUserId,
          },
        })
        .expect(200, projects.publish, done);
    });
  });
});

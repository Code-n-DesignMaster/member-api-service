const _ = require('lodash');

const { ProjectDomain, Project } = require('@sp/mongoose-models');

const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

module.exports = class ProjectLayer {
  constructor() {}

  get(_id, userId, clonedFromProjectId) {
    const query = {
      _id, userId,
      deleted: false,
    }

    return Promise
      .all([
        memberApi.account.getAccountInfoByUserId(query.userId).then(r => r.body),
        Project
          .findOne(query)
          .populate('template', 'title description src -_id')
          .lean(),
        ProjectDomain
          .find({
            $and: [
              {"userId": query.userId},
              {$or: [{"project": query._id}, {"project": {$exists: false}}]}
            ]
          }).lean()
      ])
      .then(([accountInfo, project, domains]) => {

        if(project.screenshotsDone) {
          project.previewImage = '/projects/' + project._id;
          project.template.src = '/projects/' + project._id;
        } else {
          project.previewImage = '/files/' +  project.template.src.name;
          project.template.src = '/files/' +  project.template.src.name;
        }
        project.ssl = false;

        project.domains = domains;
        project.domains = project.domains.map((domain) => {
          if (domain.type !== 'custom' || (domain.type === 'custom' && domain.isVerified)) {
            domain.name = (domain.newName !== null) ? domain.newName : domain.name;
            domain.domainId = domain._id;
            domain.link = _.trim(domain.name);
            if (domain.type === 'free') {
              domain.ssl = false;
              domain.link += '.' + (accountInfo.reseller.dynamicSubdomain || accountInfo.reseller.domain);
            }
            delete domain._id;
            return domain;
          } else {
            return;
          }
        });

        project.domains = project.domains.filter(Boolean);

        // detecting primary domain and defining link
        let primaryDomain = project.domains.find(domain => (domain) ? domain.isPrimary : false);
        if(!primaryDomain) {
          primaryDomain = project.domains[0];
          if(project.domains[0]) {
            project.domains[0].isPrimary = true;
          }
        }
        if(primaryDomain) {
          project.link = primaryDomain.link;
          project.ssl = primaryDomain.ssl;
        }

        project.screenshotUrlTemplate = `/projects/${clonedFromProjectId || _id}`;

        return project;
      });
    }
}

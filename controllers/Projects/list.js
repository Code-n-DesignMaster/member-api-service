'use strict';

const _ = require('lodash');

const logger = require('../../helpers/logger');
const models = require('@sp/mongoose-models');
const Project = models.Project;
const ProjectSettings = models.ProjectSettings;
const PartnerFavicons = models.PartnerFavicons;
const Reseller = models.Reseller;

const { DomainFormatter } = require('../../app/formatters');
const getProjectsByUserId = require('../../helpers/getProjectsByUserId');

module.exports = async (req, res, next) => {
  try {
    const onlyDeletedProjects = (req.query.deleted) ? (req.query.deleted == 'true') : false;
    const userId = req.userId;
    const accountLimits = req.account.limits;
    const resellerId = req.user.reseller.resellerId;

    let callStack = [
      getProjectsByUserId(userId, accountLimits),
      getPartnerFavicon(resellerId),
      Reseller.findOne({resellerId}).select('resellerId dynamicSubdomain settings.relay').lean(),
      getDeletedProjects(userId, accountLimits),
    ];

    if (onlyDeletedProjects === true) {
      callStack = [
        getDeletedProjects(userId, accountLimits),
        getPartnerFavicon(resellerId),
        Reseller.findOne({resellerId}).select('resellerId dynamicSubdomain settings.relay').lean(),
      ];
    }

    const [_projects, partnerFavicon, resellerSettings, deletedProjects ] = await Promise.all(callStack);
    let {projects, colors} = await getBgs([..._projects, ...deletedProjects]);
    const results = await populateProjectsWithMetadata(projects, colors, resellerId, resellerSettings, partnerFavicon)

    res.send(results);
  } catch (err) {
    next(err);
  }
};

function getDeletedProjects(userId, accountLimits) {
  return new Promise((resolve, reject) => {
    Project
      .find({
        userId,
        deleted: true
      })
      .sort('-deletedAt')
      .limit(accountLimits.maxAllowedProjects)
      .populate('domains', '_id name type useWWW isPrimary isVerified newName screenshotsDone')
      .populate('template', 'title description src -_id')
      .lean()
      .exec((error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      });
  });
}

function populateProjectsWithMetadata(projects, colors, resellerId, resellerSettings, partnerFavicon) {
  for (let i = 0; i < projects.length; i++) {
    projects[i].template = Object.assign({}, projects[i].template);
    projects[i].pages = undefined;
    projects[i].publishedProject = undefined;
    projects[i].projectTemplate = undefined;

    if(!projects[i].template.src) {
      logger.info(projects[i]._id, 'Template not found');
      projects[i].template.src = {};
    }

    if(projects[i].screenshotsDone) {
      projects[i].previewImage = '/projects/' + projects[i]._id;
      projects[i].template.src = '/projects/' + projects[i]._id;
    } else if(projects[i].template.src.path) {
      projects[i].previewImage = '/files/' +  projects[i].template.src.name;
      projects[i].template.src = '/files/' +  projects[i].template.src.name;
    }

    projects[i].ssl = false;
    projects[i].domains = projects[i].domains.map(d => DomainFormatter(d, resellerSettings)).filter(Boolean);

    // detecting primary domain and defining link
    let primaryDomain = projects[i].domains.find(domain => (domain) ? domain.isPrimary : false);
    let projectColors = colors.find(item => projects[i]._id === item._id);

    if (!primaryDomain) {
      primaryDomain = projects[i].domains[0];
      if (projects[i].domains[0]) {
        projects[i].domains[0].isPrimary = true;
      }
    }

    if (primaryDomain) {
      projects[i].link = primaryDomain.link;
      projects[i].ssl = primaryDomain.ssl;
    }

    projects[i].screenshotUrlTemplate = '/projects/' + projects[i]._id;
    projects[i].projectBgColor = _.get(projectColors, 'colors');

    let faviconLink = _.get(projectColors, 'favicons', null);

    if(!faviconLink && partnerFavicon){
      projects[i].projectBgColor = _.get(partnerFavicon, 'colors');
      faviconLink = _.get(partnerFavicon, 'faviconLink', null);
    }

    projects[i] = {
      deleted: projects[i].deleted,
      outOfPlan: projects[i].outOfPlan,
      expired: projects[i].expired,
      published: projects[i].published,
      hasChanges: projects[i].hasChanges,
      favicon: {
        background: faviconLink ? projects[i].projectBgColor : "#ffffff",
        src: faviconLink ? `${ faviconLink }` : `/favicon/favicon-32x32.png`,
        isStatic: !faviconLink
      },
      page: projects[i].page,
      _id: projects[i]._id,
      previewImage: projects[i].previewImage,
      template: { src: projects[i].template.src },
      screenshotsDone: projects[i].screenshotsDone,
      name: projects[i].name,
      num: projects[i].num,
      link: projects[i].link,
      ssl: projects[i].ssl
    }
  }
  return projects;
}

function getBgs(projects) {
  const ids = projects.map(project => project._id).sort();
  return new Promise((resolve, reject) => {
    ProjectSettings.aggregate([
      { $match: {project: { $in: ids} } },
      { $project: { _id: "$project", colors: "$projectBgColor", favicons: "$favicon" } }
    ])
      .then(result => {
        resolve({ projects, colors: result});
      })
      .catch(error => {
        reject(error);
      });
  });
}

function getPartnerFavicon(partnerId) {
  return PartnerFavicons
    .findOne({ partnerId })
    .lean()
    .then(partnerFaviconDoc => {
      if(!partnerFaviconDoc) return partnerFaviconDoc;

      let partnerFaviconMimeType;
      let partnerFaviconSize = '';

      for(const size of ["180x180", "32x32", "16x16"]) {
        if(partnerFaviconDoc.temp[size]) {
          partnerFaviconSize = size;
          partnerFaviconMimeType = partnerFaviconDoc.temp[size].mimeType.split('/')[1];
          break;
        }
      }

      return {
        colors: _.get(partnerFaviconDoc, 'temp.background', null),
        faviconLink: partnerFaviconMimeType
          ? `/partners/${ partnerId }/favicons/favicon.${ partnerFaviconMimeType }?sizes=${ partnerFaviconSize }`
          : null
      };
    })
    .catch(error => {
      logger.error(error);
      return Promise.resolve({});
    });
}


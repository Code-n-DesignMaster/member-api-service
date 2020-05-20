const config = require('../../../config');

const siteHostingUpdater = config.apiUrls.siteHostingUpdater;
const accessKey = config.apiKeys.siteHostingUpdater;

const models = require('@sp/mongoose-models');

const ProjectFavicon = models.ProjectFavicon;

module.exports = components => (data, styles) => {
  const { request } = components;

  return Promise.all([
    saveProjectStructure({ project: data }),
    saveProjectStyles(data.projectId, styles),
  ]);

  async function saveProjectStructure(requestData) {
    return ProjectFavicon
      .findOne({ projectId: data.projectId })
      .select('sizes')
      .lean()
      .then((result) => {
        if (result) {
          delete result.__v;
          requestData.favicons = result;
        }

        const options = {
          method: 'POST',
          body: requestData,
          json: true,
          qs: { accessKey },
          timeout: 15000,
        };

        return request(siteHostingUpdater, options);
      });
  }

  async function saveProjectStyles(projectId, stylesData) {
    const options = {
      method: 'POST',
      body: stylesData,
      qs: { accessKey },
      timeout: 15000,
      json: false,
    };

    return request(`${siteHostingUpdater}/${projectId}/styles`, options);
  }
};

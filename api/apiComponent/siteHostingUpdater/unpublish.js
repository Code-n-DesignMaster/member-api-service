const config = require('../../../config');
const siteHostingUpdater = config.apiUrls.siteHostingUpdater;
const accessKey = config.apiKeys.siteHostingUpdater;

module.exports = (components) =>
  (data) => {
    const request = components.request;
    const options = {
      method: 'DELETE',
      body: data,
      json: true,
      qs: { accessKey }
    };

    return request(siteHostingUpdater, options);
  };

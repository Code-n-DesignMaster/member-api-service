'use strict';

const config = require('../../../config');
const webHookUrl = config.apiUrls.webHook;

module.exports = (components) => {
  return function (data) {
    const request = components.request;

    const url = `${webHookUrl}/event/3694qnzd4gjxfnpxzqyacgkn86wyu4vz`;

    const options = {
      method: 'POST',
      body: data
    };

    return request(url, options);
  };
};

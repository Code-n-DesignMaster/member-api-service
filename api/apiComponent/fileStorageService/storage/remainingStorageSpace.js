'use strict';

const _ = require('lodash');

module.exports = (components) =>
  (accessToken, customUrl = null) => {
    const getInfo = require('./info')(components);
    return new Promise((resolve, reject) => {
      getInfo(accessToken, customUrl)
        .then(response => {
          resolve(_.get(response.body, 'storage.remaining'));
        })
        .then(reject);
    });
  };

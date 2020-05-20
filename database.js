'use strict';

const mongoose = require('@sp/mongoose-models').mongoose;
const config = require('./config');
const logger = require('./helpers/logger');

let isConnected = false; // Readiness status

mongoose.Promise = require('bluebird');

let options = Object.assign({}, {
    promiseLibrary: require('bluebird')
}, config.mongodbOptions);

mongoose.connect(config.mongodbUrl, options);
mongoose.connection.on('connected', function () {
  isConnected = true;
  logger.info('mongoose connected with pid', process.pid);
});
mongoose.connection.on('error',function (err) {
  isConnected = false;
  logger.info('mongoose connection error:', err);
});
mongoose.connection.on('disconnected', function () {
  isConnected = false;
  logger.info('mongoose disconnected');
});

mongoose.set('debug', config.mongooseDebug);

function testConnection() {
  return new Promise((resolve, reject) => {
    if (!isConnected)return reject();

    mongoose.connection.db.admin()
      .ping((err, result) => (err || !result) ? reject('no ping result') : resolve(true));
  });
}

function disconnect() {
  return new Promise((resolve) => {
    mongoose.connection.close(function () {
      logger.info('mongoose disconnected through app termination pid', process.pid);
      resolve();
    });
  });
}

module.exports.isConnected = testConnection;
module.exports.disconnect = disconnect;

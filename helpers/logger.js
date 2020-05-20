'use strict';

const Logger = require('@sp/nodejs-logger');

const config = require('../config');
const serviceName = require('../package').name;

const options = {
  environment: config.env,
  serviceName: serviceName,
  sentry: {
    enabled: config.logger.sentry.enabled || false,
    DNS: config.logger.sentry.settings.dsn,
  },
  exitOnError: true,
};

const logger = new Logger(options);

// additional EL
process.on('unhandledRejection', (reason, promise) => {
  logger.error('UnhandledRejection:', reason);
});


module.exports = logger;

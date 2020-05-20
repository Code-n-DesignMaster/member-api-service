'use strict';

const packageInfo = require('./package.json');
process.env.serviceName = packageInfo.name;

const ErrorHandling = require('@sp/nodejs-utils').errors.ErrorHandling;
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const app = express();
const config = require('./config');
const {robotsTxtHandler} = require('@sp/nodejs-utils');
const blocked = require('blocked-at');
const debug = require("debug")("app:blocked");
const logger = require('./helpers/logger');

const {
  catchRealIP,
  cleanUnwantedHeaders,
  catchAccessToken
} = require('./middlewares');

// app metrics
const metricClient = require('@sp/nodejs-app-metrics').Client;
const appMetricsMiddleware = require('@sp/nodejs-app-metrics').appMetricsMiddleware;
metricClient.register.setDefaultLabels({ serviceName: packageInfo.name });

const requestsTotalCounter = new metricClient.Counter({
  name: 'requests_total',
  help: 'Total number of requests',
});

appMetricsMiddleware(app);
//end app metrics

app.set('trust proxy', 1);
app.use(catchRealIP);
app.use(cleanUnwantedHeaders);
app.use(cors());
app.all('/', (req, res) => res.send('OK'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(catchAccessToken);

app.use((req, res, next) => {
  requestsTotalCounter.inc();
  next();
});

if (config.env !== 'production') {
  app.use(morgan('dev'));
  app.all('/config', (req, res) => res.send(config));
  app.all('/package', (req, res) => res.send(packageInfo));

  const swaggerUi = require('swagger-ui-express');
  const YAML = require('yamljs');
  const swaggerDocument = YAML.load('./swagger.yaml');
  swaggerDocument.servers[0].variables.protocol.default = 'http';
  swaggerDocument.servers[0].variables.uri.default = (process.env.API_DOCS_URL) ? process.env.API_DOCS_URL : `localhost:${config.port}`;
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  blocked((time, stack) => {
    debug(`Blocked for ${time}ms, operation started here:`, stack)
  }, { threshold: 200 })
}

app.get('/robots.txt', robotsTxtHandler({
  UserAgent: '*',
  Disallow: ['/']
}));

app.use(require('./routes'));
app.use('/v2.0', require('./routes.v2'));

app.use(ErrorHandling);
app.use((error, req, res, next) => {

  if(error.isLoggable()) {
    logger.error(error.getSystemError())
  }

  res.status(error.getStatus());
  res.send(error.getMessage());
});

module.exports = app;

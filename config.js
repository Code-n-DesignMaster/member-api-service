'use strict';

const nconf = require('nconf');
const Joi = require('joi');

const allowedEnvironments = [
  'test',
  'local',
  'development',
  'review',
  'staging',
  'production'
];

require('dotenv').config();

nconf.argv().env();
if(!nconf.get('NODE_ENV')) {
  throw new Error(`NODE_ENV parameter not defined! Please consider to use one of these environments: ${allowedEnvironments.join(', ')}`);
}

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string().allow(allowedEnvironments).default('development'),
  PORT: Joi.number().default(8080),
  DEBUG: Joi.string().default(''),

  LOGGER_SENTRY_ENABLED: Joi.boolean().default(false),
  LOGGER_SENTRY_DSN: Joi.string().default('https://692e8f68181741c2a9118386e9629fc3:84bdeffcbe864d15a51f62172ea4c30d@sentry01.dev.eu.siteplus.com/3'),

  MONGODB_HOST: Joi.string().required(),
  MONGODB_NAME: Joi.string().required(),
  MONGODB_USER: Joi.string().required(),
  MONGODB_PASS: Joi.string().required(),

  //apiUrls
  MEMBER_API: Joi.string().default('http://member-api/1.1'),
  BLOG_API: Joi.string().default('http://blog-api/1.0'),
  WEBHOOK_API: Joi.string().default('http://webhook-api/1.0'),

  SUBDOMAIN_APP: Joi.string().default('http://subdomain-app'),
  EDITOR_SOCKET_SERVICE: Joi.string().default('http://editor-socket-service'),
  EDITOR_API_SERVICE: Joi.string().default('http://editor-api-service'),
  DOMAIN_API_SERVICE: Joi.string().default('http://domain-api-service'),
  ECOMMERCE_API_SERVICE: Joi.string().default('http://ecommerce-api-service'),
  PROJECT_API_SERVICE: Joi.string().default('http://project-api-service'),
  EMBED_API_SERVICE: Joi.string().default('http://embed-api-service'),
  IMAGE_API_SERVICE: Joi.string().default('http://image-api-service'),
  FILESTORAGE_API_SERVICE: Joi.string().default('http://filestorage-api-service'),
  WORKERS_API: Joi.string().default('http://workers-api'),

  MEMBER_API_KEY: Joi.string().required(),
  BLOG_API_KEY: Joi.string().required(),
  SERVICE_API_KEY: Joi.string().required(),

  SECRET_KEY: Joi.string().default('siteplusisawesome'),
  CRYPTO_KEY: Joi.string().default('7ade314784b1a94b35f5668614234178'),
  CRYPTO_IV: Joi.string().default('187c9f3b723d687dfb8413d3dc607f46'),

  SITE_HOSTING_UPDATER_URL: Joi.string().default('http://site-hosting-updater.siteplus.com'),
  SITE_HOSTING_UPDATER_ACCESS_KEY: Joi.string().default('HdPENnG5Aqy86Byp'),

  STATIC_URL: Joi.string().required(),
  FRONTEND_APP_URL: Joi.string().required(),
  IMAGE_API_SERVICE_URL: Joi.string().required(),

  TEMPLATE_URL_SUFFIX: Joi.string().required(),
  FREE_DOMAIN_SUFFIX: Joi.string().required(),

  MAX_ALLOWED_PAGES_PER_PROJECT: Joi.number().default(5),
  MAX_ALLOWED_PROJECTS: Joi.number().default(200),
  MAX_FILES_NUMBER_PER_USER: Joi.number().default(100000),

  MONGODB_OPTIONS_USE_MONGO_CLIENT: Joi.boolean().default(true),
  MONGODB_OPTIONS_AUTOINDEX: Joi.boolean().default(false),
  MONGOOSE_DEBUG: Joi.boolean().default(false),

  API_DOCS_URL: Joi.string()
}).unknown()
  .required();

const { error, value: envVars } = Joi.validate(nconf.get(), envVarsSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  app: { version: 'v1.1' },
  port: envVars.PORT,
  debug: envVars.DEBUG,
  mongodbUrl: `mongodb://${envVars.MONGODB_USER}:${envVars.MONGODB_PASS}@${envVars.MONGODB_HOST}/${envVars.MONGODB_NAME}`,
  mongooseDebug: envVars.MONGOOSE_DEBUG,
  mongodbOptions: {
    'useMongoClient': envVars.MONGODB_OPTIONS_USE_MONGO_CLIENT,
    'autoIndex': envVars.MONGODB_OPTIONS_AUTOINDEX
  },
  logger: {
    'sentry': {
      'enabled': envVars.LOGGER_SENTRY_ENABLED,
      'settings': {
        'dsn': envVars.LOGGER_SENTRY_DSN
      }
    }
  },
  apiUrls: {
    'member': envVars.MEMBER_API,
    'blogApi': envVars.BLOG_API,
    'webHook': envVars.WEBHOOK_API,
    'workersApi': envVars.WORKERS_API,
    'domainService': envVars.DOMAIN_API_SERVICE,
    'ecommerceService': envVars.ECOMMERCE_API_SERVICE,
    'editorService': envVars.EDITOR_API_SERVICE,
    'projectService': envVars.PROJECT_API_SERVICE,
    'embedService': envVars.EMBED_API_SERVICE,
    'editorSocketService': envVars.EDITOR_SOCKET_SERVICE,
    'imageService': envVars.IMAGE_API_SERVICE,
    'subdomainApp': envVars.SUBDOMAIN_APP,
    'fileStorageService': envVars.FILESTORAGE_API_SERVICE,
    'siteHostingUpdater': envVars.SITE_HOSTING_UPDATER_URL,
  },
  apiKeys: {
    memberApi: envVars.MEMBER_API_KEY,
    blogApiKey: envVars.BLOG_API_KEY,
    servicesApiKey: envVars.SERVICE_API_KEY,
    siteHostingUpdater: envVars.SITE_HOSTING_UPDATER_ACCESS_KEY,
  },

  secretKey: envVars.SECRET_KEY,
  cryptoKey: envVars.CRYPTO_KEY,
  cryptoIv: envVars.CRYPTO_IV,

  urlPrefixes: {
    'frontendApp': envVars.FRONTEND_APP_URL,
    'static': envVars.STATIC_URL,
    'imageApiService': envVars.IMAGE_API_SERVICE_URL,
  },

  templateUrlSuffix: envVars.TEMPLATE_URL_SUFFIX,
  freeDomainSuffix: envVars.FREE_DOMAIN_SUFFIX,

  ecommerceVersionName: 'ecommerce',

  maxAllowedPagesPerProject: envVars.MAX_ALLOWED_PAGES_PER_PROJECT,
  maxAllowedProjects: envVars.MAX_ALLOWED_PROJECTS,

  storage: {
    maxFilesNumberPerUser: envVars.MAX_FILES_NUMBER_PER_USER
  },
};

console.log('======================== Config ========================');
console.log(config);
console.log('========================================================');

module.exports = config;

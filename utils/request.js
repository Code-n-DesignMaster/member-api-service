'use strict';

const config = require('../config');
const _ = require('lodash');
const request = require('request');
const logger = require('../helpers/logger');

/**
 Works as node-fetch, but
 has 3rd argument to pass access token (to not to play with headers),
 returns {statusCode, body} as resolve,
 and {statusCode, error} as reject
 *no need for .then(response => response.json())
 */
module.exports = (url, options = {}, accessToken = null) => {
  const strictOptions = {
    headers: {
      'User-Agent': 'Member-API-Service'
    }
  };

  for (let strictOption in strictOptions) {
    if (!options[strictOption]) {
      options[strictOption] = {};
    }
    options[strictOption] = Object.assign(options[strictOption], strictOptions[strictOption]);
  }

  if (accessToken) {
    options.headers['Authorization'] = 'Bearer ' + accessToken;
  }
  options.headers['app-version'] = config.app.version;

  return new Promise((resolve, reject) => {
    const args = {
      method: options.method || 'GET',
      url,
      headers: options.headers,
      qs: options.qs || {},
      useQueryString: true,
      strictSSL: (config.env === 'production'),
      timeout: parseInt(options.timeout) || 5000
    };

    if (args.method !== 'GET') {
      args.json = (options.json !== false);
      args.body = options.body || {};
      if (!args.json) {
        args.form = args.body;
        delete args.body;
      }
    }

    const acceptJson = !args.headers.hasOwnProperty('Accept') || args.headers.Accept === 'application/json';

    request(args, (error, response, body) => {
      if (error || !response) {
        logger.error({error, url});
        return reject(error);
      }

      let result = {
        statusCode: response.statusCode,
        headers: response.headers,
        body,
        error
      };

      //logger.debug('acceptJson', acceptJson);

      if (_.isString(result.body) && acceptJson) {
        if (result.body !== '') {
          try {
            result.body = JSON.parse(result.body);
          } catch (error) {
            logger.error({url, message: 'Error in JSON.parse(body)', error, body});
            result.body = {};
          }
        } else {
          result.body = {};
        }
      }
      result = _.omitBy(result, _.isNull);

      if (isBetween(result.statusCode, 300, 399)) {
        result.statusCode = 417; // Expectation Failed
        result.body = {
          type: "unexpected-redirection",
          message: "Got redirect when expected data"
        };
        return reject(result);
      }

      if (result.error || isBetween(result.statusCode, 500, 599)) {
        result.body = {
          type: "system",
          message: result.error || _.get(result, 'body.message')
        };
        return reject(result);
      }

      if (result.error || !isBetween(result.statusCode, 200, 299)) {
        return reject(result);
      } else {
        return resolve(result);
      }
    });
  })
    .catch(exception => {
      logger.info('Request Utils Exception:', exception.statusCode, url);
      return Promise.reject(exception);
    });
};

function isBetween(number, left, right, inclusive = true) {
  const [min, max] = [left, right].sort((a, b) => a - b);

  return inclusive ?
    number >= min && number <= max :
    number > min && number < max;
}

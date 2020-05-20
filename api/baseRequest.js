'use strict';

const request = require('request-promise');

// require('request-promise').debug = true;

module.exports = request.defaults({
  headers: {'User-Agent': 'Member-Api-Service'},
});

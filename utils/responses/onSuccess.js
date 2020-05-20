'use strict';

module.exports = (responseObject, body = {}) => {
  responseObject
    .status(200)
    .send(body);
};

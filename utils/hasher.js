'use strict';

const _ = require('lodash');
const crypto = require('crypto');

const config = require('./../config');
const crypter = require('./crypter');

class Hasher {
  constructor(secretKey) {
    this._secretKey = secretKey;
  }

  md5(data) {
    if (!data) data = '';

    return crypto.createHash('md5').update(data.toString()).digest('hex');
  }

  secretMd5(data) {
    return this.md5(this.md5(data) + this._secretKey);
  }

  saltedMd5(data, salt) {
    return this.md5(this.md5(data) + salt);
  }

  hash(data) {
    if (!data) data = '';

    return this.secretMd5(crypter.encrypt(data));
  }

  check(plain, hashed) {
    return this.hash(plain) === hashed;
  }

  randomPass() {
    return this.hash(new Date().getTime()).toString().slice(8, 8);
  }

  replaceWithStars(string, percentage) {
    let from, to, length, replacement;

    string = _.trim(string);
    length = parseInt(string.length * percentage / 100);
    replacement = _.repeat('*', length);
    from = parseInt((string.length - length) / 2);
    to = from + length;

    return string.substring(0, from - 1) + replacement + string.substring(to - 1);
  }
}

module.exports = new Hasher(config.secretKey);

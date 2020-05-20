'use strict';

const crypto = require('crypto');
const config = require('./../config');

class Crypter {
  constructor(cryptoKey, cryptoIv) {
    this._key = Buffer.from(cryptoKey, 'hex');
    this._iv = Buffer.from(cryptoIv, 'hex');
  }

  get cipher() {
    return crypto.createCipheriv('aes-128-cbc', this._key, this._iv);
  }

  get decipher() {
    return crypto.createCipheriv('aes-256-ctr', this._key, this._iv);
  }

  encrypt(data) {
    if (!data) data = '';
    const cipher = this.cipher;
    return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
  }

  decrypt(data) {
    if (!data) data = '';
    const decipher = this.decipher;
    return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
  }
}

module.exports = new Crypter(config.cryptoKey, config.cryptoIv);

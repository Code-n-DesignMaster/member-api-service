const Mapper = require('./Mapper');
const { AccessToken } = require('@sp/mongoose-models');

module.exports = new class AccessTokenMapper extends Mapper {
  constructor() {
    super(AccessToken);
  }
};

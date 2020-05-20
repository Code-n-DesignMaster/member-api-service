'use strict';

const Google = require('./Google');
const Mailchimp = require('./Mailchimp');
const Facebook = require('./Facebook');
const Dropbox = require('./Dropbox');
const Instagram = require('./Instagram');
const Box = require('./Box');
const Flickr = require('./Flickr');

const classMap = {
  google: Google,
  mailchimp: Mailchimp,
  facebook: Facebook,
  box: Box,
  dropbox: Dropbox,
  instagram: Instagram,
  flickr: Flickr,
};

module.exports = (name, token, projectId, resellerId, settings) => {
  return new classMap[name](name, token, projectId, resellerId, settings);
};

'use strict';

const logger = require('../../helpers/logger');

const models = require('@sp/mongoose-models');
const AccessToken = models.AccessToken;

module.exports = (req, res, next) => {
  const offset = +req.query.offset || 0;
  const limit = +req.query.limit || 100;
  const userId = req.userId;

  Promise.all([
    AccessToken.find({ userId }).count(),
    AccessToken
      .find({ userId, isSystem: { $ne: true } })
      .select('ipAddress metadata.country metadata.userAgent.platform  metadata.userAgent.source metadata.userAgent.browser metadata.userAgent.version updatedAt')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean()
  ])
    .then(([count, data]) => {
      res.send({
        offset,
        limit,
        count,
        data: data.map(item => {
          item.online = (+item.updatedAt + (3600 * 15)) > Date.now();
          return item;
        })
      });
    })
    .catch(next);
};


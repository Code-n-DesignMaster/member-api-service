'use strict';

const logger = require('../../helpers/logger');

const Events = require('./events');

class eventManager {
  constructor(incomingEventMessage) {
    const [type, status] = incomingEventMessage.type.split(':');
    this.type = type;
    this.status = status;

    this.payload = incomingEventMessage.payload;
  }

  processEvent() {
    return new Promise((resolve, reject) => {
      let event;
      try {
        event = new Events[this.type](this.payload.memberId, this.status, this.payload);
        event.process()
          .then((data) => {
            resolve(data);
          })
          .catch(err => {
            reject(err);
            logger.error(err);
          });
      }
      catch (err) {
        logger.error(err);
        reject(err);
      }
    });
  }
}

/**
 * http://member-api-service/events?apiKey=8d6fc59179ee4d9dbd720fb32726d0f0 // apiKey is for stage and dev env
 *
 */
module.exports = (req, res, next) => {
  new eventManager(req.body).processEvent()
    .then(() => {
      res.status(200).send({});
    })
    .catch(next)
};

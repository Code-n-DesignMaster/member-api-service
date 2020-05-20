'use strict';

const logger = require('../../../helpers/logger');

const apiComponent = require('../../../api/apiComponent');
const memberApi = apiComponent.getApi('member');

const models = require('@sp/mongoose-models');
const AccountsInfo = models.AccountsInfo;

module.exports = class {
  constructor(userId, status) {
    this.userId = userId;
    this.status = status;
  }

  process() {
    return this.getData()
      .then((memberInfo) => {
        try {
          this[this.status](memberInfo);
          return memberInfo;
        }
        catch (err) {
          logger.error(err);
          return Promise.reject(err);
        }

      });
  }

  getData() {
    return memberApi.account.getAccountInfoByUserId(this.userId)
      .then(response => {
        response.body._id = response.body.id;
        delete response.body.id;
        return response.body;
      });
  }

  created(memberInfo) {
    return this._update(memberInfo);
  }

  updated(memberInfo) {
    return this._update(memberInfo);
  }

  _updateIfNotExist(memberInfo) {
    return this._update(memberInfo);
  }

  _update(memberInfo) {
    return new Promise((resolve, reject) => {
      AccountsInfo.update(
        { _id: this.userId },
        { $set: memberInfo },
        { upsert: true },
        (error, result) => {
          if (error) {
            logger.error(error);
            return reject({
              statusCode: 500,
              body: {
                type: 'system',
                message: 'Cannot update user'
              }
            });
          }
          resolve(result);
        }
      );
    });
  }

  statusChanged(memberInfo) {
    try {
      return this[memberInfo.status + 'Status'](memberInfo);
    }
    catch (err) {
      logger.error(err);
    }
  }

  pendingStatus(memberInfo) {
    return new Promise(() => {
      this._update(memberInfo)
        .then(() => {
          // Add some actions if required
        })
        .catch((err) => {
          logger.error(err);
        });
    });
  }

  activeStatus(memberInfo) {
    return new Promise(() => {
      this._update(memberInfo)
        .then(() => {
          // Add some actions if required
        })
        .catch((err) => {
          logger.error(err);
        });
    });
  }

  suspendedStatus(memberInfo) {
    return new Promise(() => {
      this._update(memberInfo)
        .then(() => {
          // Add some actions if required
        })
        .catch((err) => {
          logger.error(err);
        });
    });
  }

  terminatedStatus(memberInfo) {
    return new Promise(() => {
      this._update(memberInfo)
        .then(() => {
          // Add some actions if required
        })
        .catch((err) => {
          logger.error(err);
        });
    });
  }

  archivedStatus(memberInfo) {
    return new Promise(() => {
      this._update(memberInfo)
        .then(() => {
          // Add some actions if required
        })
        .catch((err) => {
          logger.error(err);
        });
    });
  }
};

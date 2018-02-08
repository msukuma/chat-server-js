const {
  ERROR,
  WARNING,
  INFO,
  MESSAGE,
  CONFIRMATION,
  MESSAGE_KEYS, } = require('./constants');
const { isoTimeStamp } = require('./util');
const assert = require('assert');

class MessagesManager {
  constructor(server, options = {}) {
    this._server = server;
    this._log = server.log;
  }

  _validate(data) {
    MESSAGE_KEYS.forEach(k => assert(data.hasOwnProperty(k)));
  }

  _write(socket, data) {
    const _this = this;
    return new Promise(function (resolve, reject) {
      socket.write(JSON.stringify(data), () => {
          _this._log.message(data);
          resolve();
        });
    });
  }

  _serverMessage(socket, type, message) {
    return this._write(socket, {
      type: type,
      content: message,
      timestamp: isoTimeStamp(),
    });
  }

  valid(data) {
    try {
      this._validate(data);
      return true;
    } catch (e) {
      return false;
    }
  }

  broadcast(fromSkt, data) {
    this._server.sessions.forEach((toSkt, userId) => {
      if (fromSkt.id !== toSkt.id) {
        data.to = toSkt.userId;

        // this._write(toSkt, data);
        this.deliver(fromSkt, toSkt, data);
      }
    });
  }

  receive(socket, message) {
    return this._serverMessage(socket, CONFIRMATION, 'received');
  }

  deliver(fromSkt, toSkt, message) {
    return this._serverMessage(toSkt, MESSAGE, message)
                .then(this.confirmDelivery(fromSkt, message));
  }

  confirmDelivery(fromSkt, message) {
    return this._serverMessage(fromSkt, CONFIRMATION, 'delivered');
  }

  info(socket, message) {
    this._serverMessage(socket, INFO, message)
        .resolve();
  }

  warn(socket, message) {
    this._serverMessage(socket, WARNING, message)
        .resolve();
  }

  error(socket, message) {
    this._serverMessage(socket, ERROR, message)
        .resolve();
  }
}

module.exports = MessagesManager;

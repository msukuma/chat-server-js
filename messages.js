const {
  ERROR,
  WARNING,
  INFO,
  MESSAGE,
  STATUS,
  MESSAGE_KEYS, } = require('./constants');
const { isoTimeStamp } = require('./util');
const assert = require('assert');

class Messages {
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

  broadcast(fromSkt, message) {
    this._server.sessions.forEach((toSkt, userId) => {
      if (fromSkt.id !== toSkt.id) {
        message.to = toSkt.userId;

        this.deliver(toSkt, message)
            .then(this.confirmDelivery(fromSkt, message));
      }
    });
  }

  receive(socket, message) {
    message.id = Date.now();
    let msg = {
      status: 'received',
      content: message,
    };
    return this._serverMessage(socket, STATUS, msg);
  }

  deliver(toSkt, message) {
    return this._serverMessage(toSkt, MESSAGE, message);
  }

  confirmDelivery(fromSkt, message) {
    let msg = {
      status: 'delivered',
      messageId: message.id, };
    return this._serverMessage(fromSkt, STATUS, msg);
  }

  info(socket, message) {
    return this._serverMessage(socket, INFO, message);
  }

  warn(socket, message) {
    return this._serverMessage(socket, WARNING, message);
  }

  error(socket, message) {
    return this._serverMessage(socket, ERROR, message);
  }
}

module.exports = Messages;

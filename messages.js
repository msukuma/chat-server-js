const {
  SERVER,
  ERROR,
  WARNING,
  INFO,
  MESSAGE,
  STATUS,
  DELIVERED,
  MESSAGE_KEYS, } = require('./constants');
const { isoTimeStamp } = require('./util');
const Frame = require('./frame');
const assert = require('assert');

class Messages {
  constructor(server, options = {}) {
    this._server = server;
    this._log = server.log;
  }

  _validate(data) {
    MESSAGE_KEYS.forEach(k => assert(data.hasOwnProperty(k)));
  }

  _write(socket, string) {
    const _this = this;
    const frame = new Frame({ payload: string });

    return new Promise(function (resolve, reject) {
      socket.write(frame.buffer, () => {
          _this._log.message(data);
          resolve();
        });
    });
  }

  _serverMessage(socket, type, message) {
    return this._write(socket, JSON.stringify({
      type: type,
      from: SERVER,
      content: message,
      timestamp: isoTimeStamp(),
    }));
  }

  valid(data) {
    try {
      this._validate(data);
      return true;
    } catch (e) {
      return false;
    }
  }

  broadcast(req) {
    this._server.sessions.forEach((toSkt, userId) => {
      if (req.socket.id !== toSkt.id) {
        req.message.to = toSkt.userId;

        this.deliver(toSkt, req.message)
            .then(this.confirmDelivery(req));
      }
    });
  }

  receive(req) {
    req.message.id = Date.now();
    let msg = {
      status: 'received',
      content: req.message,
    };
    return this._serverMessage(req.socket, STATUS, msg);
  }

  deliver(toSkt, message) {
    return this._serverMessage(toSkt, MESSAGE, message);
  }

  confirmDelivery(req) {
    let msg = {
      status: DELIVERED,
      messageId: req.message.id,
    };
    return this._serverMessage(req.socket, STATUS, msg);
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

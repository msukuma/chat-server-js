const {
  MESSAGE,
  INFO,
  WARNING,
  ERROR,
  MESSAGE_KEYS, } = require('./constants');
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
    socket.write(JSON.stringify(data));
    this._log.message(data);
  }

  _serverMessage(socket, type, message) {
    this._write(socket, {
      type: type,
      content: message,
      timestamp: new Date().toISOString(),
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

  receive(socket, data) {

  }

  broadcast(fromSkt, data) {
    this._server.sessions.forEach((toSkt, userId) => {
      if (fromSkt.id !== toSkt.id) {
        data.to = toSkt.userId;
        this._write(toSkt, data);
      }
    });
  }

  info(socket, message) {
    this._serverMessage(socket, INFO, message);
  }

  warn(socket, message) {
    this._serverMessage(socket, WARNING, message);
  }

  error(socket, message) {
    this._serverMessage(socket, ERROR, message);
  }
}

module.exports = MessagesManager;

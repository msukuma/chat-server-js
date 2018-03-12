const {
  SERVER,
  ERROR,
  WARNING,
  INFO,
  MESSAGE,
  STATUS,
  DELIVERED,
  MESSAGE_PROP_TYPES, } = require('./constants');
const { isoTimeStamp } = require('./util');
const Frame = require('./frame');

class ResponseHandler {
  constructor(server, options = {}) {
    this._server = server;
    this.sessions = this._server.sessions.keys;
    this._log = server.log;
  }

  _write(socket, msg) {
    const _this = this;
    const frame = new Frame({ payload: msg });

    return new Promise(function (resolve, reject) {
      socket.write(frame.toBuffer(), () => {
          _this._log.message(msg);
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

  broadcast(req, cb) {
    let i = 0;
    const startSize = this._server.sessions.size;
    const promises = [];

    this._server.sessions.forEach((_, toSkt) => {
      req.message.to = toSkt.userId;

      if (i < startSize) {
        promises[i++] = this.deliver(toSkt, req.message);
      } else {
        promises.push(this.deliver(toSkt, req.message));
      }
    });

    Promise.all(promises).then(cb);
  }

  deliver(toSkt, message, cb) {
    if (cb)
      return this._serverMessage(toSkt, MESSAGE, message)
                  .then(cb);

    return this._serverMessage(toSkt, MESSAGE, message);
  }

  // receive(req) {
  //   req.message.id = Date.now();
  //   let msg = {
  //     status: 'received',
  //     content: req.message,
  //   };
  //   return this._serverMessage(req.socket, STATUS, msg);
  // }

  // confirmDelivery(req) {
  //   let msg = {
  //     status: DELIVERED,
  //     messageId: req.message.id,
  //   };
  //   return this._serverMessage(req.socket, STATUS, msg);
  // }

  info(socket, message) {
    return this._serverMessage(socket, INFO, message);
  }

  warn(socket, message) {
    return this._serverMessage(socket, WARNING, message);
  }

  error(socket, err) {
    return this._serverMessage(socket, ERROR, err);
  }

  ping(req) {
    console.log('implement');
  }

  pong(req) {
    console.log('implement');
  }
}

module.exports = ResponseHandler;

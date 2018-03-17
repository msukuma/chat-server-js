const {
  SERVER,
  ERROR,
  WARNING,
  INFO,
  MESSAGE,
  STATUS,
  DELIVERED,
  BAD_HANDSHAKE_RESPONSE,
  GOOD_HANDSHAKE_RESPONSE_PREFIX,
  GOOD_HANDSHAKE_RESPONSE_SUFFIX,
  TEXT,
  CONTINUATION,
  PING,
  PONG,
  MESSAGE_PROP_TYPES,
  GUID,
} = require('./constants');
const { isoTimeStamp } = require('./util');
const { createReadStream } = require('fs');
const Frame = require('./frame');
const crypto = require('crypto');

class ResponseHandler {
  constructor(server, options = {}) {
    this._server = server;
    this.sessions = this._server.sessions.keys;
    this._log = server.log;
  }

  _write(socket, obj) {
    const data = obj instanceof Frame ? obj.toBuffer() : obj;

    return new Promise((resolve, reject) => {
      socket.write(data, resolve);
    });
  }

  _writeMsg(socket, msg, meta = {}) {
    const _this = this;
    let args = meta;
    let frame;

    args.payload = msg;
    frame = new Frame(args);

    return this._write(socket, frame);
  }

  _serverMessage(socket, type, message) {
    return this._writeMsg(socket, JSON.stringify({
      type: type,
      from: SERVER,
      content: message,
      timestamp: isoTimeStamp(),
    }));
  }

  badHandshake(req) {
    return this._write(req.socket, BAD_HANDSHAKE_RESPONSE);
  }

  goodHandshake(req) {
    const resp = GOOD_HANDSHAKE_RESPONSE_PREFIX +
                 this._acceptHash(req) +
                 GOOD_HANDSHAKE_RESPONSE_SUFFIX;

    return this._write(req.socket, resp);
  }

  broadcast(req) {
    const promises = [];

    const frames = this._framify(req);

    this._server.sessions.forEach((_, toSkt) => {
      promises.push(this._deliver(toSkt, frames));
    });

    return Promise.all(promises);
  }

  _framify(req) {
    let s = 0;
    let e = 255;
    const length = req.buffer.length;
    const frames = [];

    while (s < length) {
      frames.push(new Frame({
        payload: req.buffer.slice(s, e),
        fin: 0,
        opcode: 0,
      }));

      s = e;
      e += 255;
    }

    frames[0].fin = 0;
    frames[0].opcode = 1;
    frames[frames.length - 1].fin = 1;

    return frames;
  }

  _deliver(toSkt, frames) {
    return Promise.all(frames.map(f => this._write(toSkt, f)));
  }

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
    const frame = new Frame({
      payload: req.buffer,
      opcode: PONG,
    });

    return this._writeMsg(frame.toBuffer());
  }

  pong(req) {
    return new Promise((resolve, reject) => {
      console.log('implement pong pas necessaire');
      resolve();
    });
  }

  _acceptHash(req) {
    return crypto
      .createHash('sha1')
      .update(req.secWSKey + GUID)
      .digest('base64');
  }
}

module.exports = ResponseHandler;

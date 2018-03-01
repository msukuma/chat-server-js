const {
  DATA,
  GET,
  MESSAGE,
  MESSAGE_KEYS,
  COMPLETE,
  FRAME_ERROR,
  TEXT,
  WS_CLOSE,
  PING,
  PONG,
  HANDSHAKE,
  HANDSHAKE_REGEX,
  HTTP_VERSION_REGEX,
  UPGRADE,
  WEBSOCKET, } = require('./constants');
const Request = require('./request');
const httpHeaders = require('http-headers');
const Frame = require('./frame');
const { EventEmitter } = require('events');
const { HandshakeError } = require('./errors');

class RequestHandler extends EventEmitter {
  constructor(server, options = {}) {
    super();
    this._server = server;
    this.requests = this._server.requests;

    this._onComplete();
  }

  _onComplete() { // move this server?
    this.on(COMPLETE, req => this.requests.update(req.socket, null));
  }

  handle(socket) {

    socket.on(DATA, (buf) => {
      let req;
      let headers;
      let str = buf.toString().trim();

      if (this._isHandShake(socket, str)) {
        req = new Request(socket);

        try {
          this._parseHeaders(req, str);
          this._validateHeaders(req);
          this._server.emit(HANDSHAKE, null, req);
        } catch (e) {
          this._server.emit(HANDSHAKE, e, req);
        }

      } else {
        req = this.requests.get(socket);

        if (!req) {
          req = new Request(socket);
          this.requests.set(socket, req);
        }

        this._handleFrame(new Frame(buf), req);
      }
    });
  }

  _isHandShake(socket, str) {
    // make wrapper func for connections.has on server?
    return !this.requests.exists(socket) && HANDSHAKE_REGEX.test(str);
  }

  _parseHeaders(req, str) {
    const headers  = httpHeaders(str);
    req.method = headers.method;
    req.url = headers.url;
    req.httpVersion = parseFloat(
      `${headers.version.major}.${headers.version.minor}`);
    req.headers = headers.headers;
  }

  _validateHeaders(req) {
    return true;
  }

  _validateFrame(frame) {
    if (!frame.mask)
      throw new Error('Mask not set');
  }

  _validateMessage(msg) {
    MESSAGE_KEYS.forEach(k => assert(msg.hasOwnProperty(k)));
  }

  _handleFrame(frame, req) { //use frame obj
    console.log(frame);
    try {
      this._validateFrame(frame);
    } catch (e) {
      return this._server.emit(MESSAGE, e);
    }

    req.push(frame.payload);

    if (frame.fin) {
      if (frame.opcode === TEXT) {
        try {
          this._validateMessage(req.message);
          return this._server.emit(MESSAGE, null, req);
        } catch (e) {
          this._server.emit(MESSAGE, e, req);
        }
      }

      switch (frame.opcode) {
        case 0x8: //close frame
          req.type = CLOSE;
        case 0x9:
          return this._server.emit(PING, req); // TODO implement
        case 0xA:
          return this._server.emit(PONG, req); // TODO implement
      }
    }
  }
}

module.exports = RequestHandler;

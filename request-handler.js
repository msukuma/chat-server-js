const {
  DATA,
  GET,
  SESSION,
  MESSAGE,
  COMPLETE,
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
    this.requests = new Map();

    this._onSession();
    this._onMessage();
    this._onCompletion();
  }

  _onSession() {
    this.on(SESSION, (err, req) => {
      if (err)
        return this._server.emit(SESSION, err);

      this._server.emit(SESSION, null, req);
    });
  }

  _onMessage() {
    this.on(MESSAGE, (err, req) => {
      if (err)
        return this._server.emit(MESSAGE, err);

      if (req.message.type === SESSION)
        return this.emit(SESSION, null, req);

      this._server.emit(MESSAGE, null, req);
    });
  }

  _onCompletion() {
    this.on(COMPLETE, req => this.requests.put(req.socket, null));
  }

  handle(socket) {

    socket.on(DATA, (buf) => {
      let req;
      let headers;
      let str = buf.toString().trim();

      if (this._isHandShake(buf, str)) {
        req = new Request(socket);
        this.requests.set(socket, req);

        try {
          this._parseHeaders(req, str);
          this._server.emit(HANDSHAKE, null, req);
        } catch (e) {
          this._server.emit(HANDSHAKE, e);
        }

      } else {
        req = this.requests.get(socket);

        if (!req) {
          req = new Request(socket);
          this.requests.set(socket, req);
        }

        this._handleFrame(req, new Frame(buf));
      }

    });
  }

  _isHandShake(socket, str) {
    // make wrapper func for connections.has on server?
    return !this._server.__connections.has(socket) && HANDSHAKE_REGEX.test(str);
  }

  _parseHeaders(req, str) {
    const headers  = httpHeaders(str);
    req.method = headers.method;
    req.url = headers.url;
    req.httpVersion = parseFloat(
      `${headers.version.major}.${headers.version.minor}`);
    req.headers = headers.headers;
  }

  _handleFrame(req, frame) { //use frame obj
    console.log(frame);
    try {
      if (!frame.mask)
        throw new Error('Mask not set');

      req.push(frame.payload);
    } catch (e) {
      this._server.emit(MESSAGE, e, req);
    }

    if (frame.fin) {
      switch (frame.opcode) {
        case 0x8: //close frame
          return this._server.emit(WS_CLOSE, req); // TODO implement
        case 0x9:
          return this._server.emit(PING, req); // TODO implement
        case 0xA:
          return this._server.emit(PONG, req); // TODO implement
      }

      if (frame.opcode === 0x1) {
        try {

        } catch (e) {

        } finally {

        }
      }
    }

    this.emit(MESSAGE, null, req);
  }
}

module.exports = RequestHandler;

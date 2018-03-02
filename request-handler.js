const {
  DATA,
  GET,
  MESSAGE,
  MESSAGE_KEYS,
  COMPLETE,
  TEXT,
  WS_CLOSE,
  PING,
  PONG,
  HANDSHAKE,
  HANDSHAKE_REGEX,
  HTTP_VERSION_REGEX,
  UPGRADE,
  WEBSOCKET, } = require('./constants');
const {
  HandshakeError,
  MessageError,
  FrameError, } = require('./errors');
const { EventEmitter } = require('events');
const Request = require('./request');
const httpHeaders = require('http-headers');
const Frame = require('./frame');
const assert = require('assert');

class RequestHandler extends EventEmitter {
  constructor(server, options = {}) {
    super();
    this._server = server;
    this.requests = this._server.requests;
  }

  handle(socket) {

    socket.on(DATA, (buf) => {
      let req;
      let headers;
      let str = buf.toString().trim();

      if (this._isNewHandShake(socket, str)) {
        req = new Request(socket);

        try {
          headers = httpHeaders(str);
          this._validateHeaders(headers);
          this._setHeaders(req, headers);
          this._server.emit(HANDSHAKE, null, req);
        } catch (e) {
          console.log(e);
          this._server.emit(HANDSHAKE, e, req);
        }

      } else if (this._isHandShake(str)) {
        this._server.emit(
          HANDSHAKE,
          new HandshakeError('handshake already complete')
        );
      } else {
        req = this.requests.get(socket);

        if (!req) {
          req = new Request(socket);
          this.requests.update(socket, req);
        }

        this._handleFrame(new Frame(buf), req);
      }
    });
  }

  complete(req) {
    this.requests.update(req.socket, null);
  }

  _handleFrame(frame, req) { //use frame obj
    console.log('received', frame);
    try {
      this._validateFrame(frame);
    } catch (e) {
      console.log(e);
      return this._server.emit(MESSAGE, e, req);
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

      this._server.emit(frame.opcode, req);
    }
  }

  _isNewHandShake(socket, str) {
    return !this.requests.exists(socket) &&
            this._isHandShake(str);
  }

  _isHandShake(str) {
    return HANDSHAKE_REGEX.test(str);
  }

  _setHeaders(req, headers) {
    req.method = headers.method;
    req.url = headers.url;
    req.httpVersion = parseFloat(
      `${headers.version.major}.${headers.version.minor}`);
    req.headers = headers.headers;
  }

  _validateHeaders(headers) {
    // throw HandshakeError
    return true;
  }

  _validateFrame(frame) {
    if (!frame.mask)
      throw new FrameError('Mask not set');
  }

  _validateMessage(msg) {
    MESSAGE_KEYS.forEach(k => {
      if (!msg.hasOwnProperty(k))
        throw new MessageError(k);
    });
  }
}

module.exports = RequestHandler;

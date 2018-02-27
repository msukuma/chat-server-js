const {
  DATA,
  GET,
  MESSAGE,
  HANDSHAKE,
  HANDSHAKE_REGEX,
  HTTP_VERSION_REGEX,
  UPGRADE,
  WEBSOCKET, } = require('./constants');
const Request = require('./request');
const httpHeaders = require('http-headers');
const Frame = require('./frame');

class RequestHandler {
  constructor(server, options = {}) {
    this._server = server;
    this.requests = new Map();
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

      switch (frame.opcode) {
        case 0x1:
        case 0x0:
          req.push(frame.payload);
          break;
      }
    } catch (e) {
      this._server.emit(MESSAGE, e, req);
    }

    if (frame.fin)
      this._server.emit(MESSAGE, null, req);
  }
}

module.exports = RequestHandler;

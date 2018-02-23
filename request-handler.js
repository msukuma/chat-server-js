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

class RequestHandler {
  constructor(server, options = {}) {
    this._server = server;
    this.requests = new Map();
  }

  handle(socket) {

    socket.on(DATA, (data) => {
      let req;
      let headers;
      let str = data.toString().trim();

      if (this._isHandShake(data, str)) {
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

        try {
          if (this._checkFrame(req, data)) {
            this._server.emit(MESSAGE, null, req);
          }
        } catch (e) {
          this._server.emit(MESSAGE, e, req);
        }

      }

    });
  }

  _isHandShake(socket, str) {
    // make wrapper func for connections.has on server?
    return !this._server.connections.has(socket) && HANDSHAKE_REGEX.test(str);
  }

  _parseHeaders(req, str) {
    const headers  = httpHeaders(str);
    req.method = headers.method;
    req.url = headers.url;
    req.httpVersion = parseFloat(
      `${headers.version.major}.${headers.version.minor}`);
    req.headers = headers.headers;
  }

  _checkFrame(req, buf) {
    const FIN = buf[0] & 128;

    // ignore exts 4 now;
    // const RSV1 = buf[0] & 64;
    // const RSV2 = buf[0] & 32;
    // const RSV3 = buf[0] & 16;
    const OPCODE = buf[0] & 15;
    const MASK = buf[1] & 128;
    const length = buf[1] & 127;
    let maskingKey;
    let encoded;
    let payload;

    if (!MASK) throw new Error('Mask not set');
    maskingKey = buf.slice(2, 6); // look @ https://github.com/broofa/node-int64
    encoded = buf.slice(6);
    payload = Buffer.allocUnsafe(encoded.length);

    for (var i = 0; i < encoded.length; i++) {
      payload[i] = encoded[i] ^ maskingKey[i % 4];
    }

    switch (OPCODE) {
      case 0x1:
      case 0x0:
        req.push(payload);
        break;
      default:

    }

    if (FIN) return true; // use EventEmitter?
  }
}

module.exports = RequestHandler;

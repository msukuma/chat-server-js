const {
  DATA,
  HANDSHAKE,
  GET,
  HTTP_VERSION_REGEX,
  HANDSHAKE_REGEX,
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
          this._server.emit(HANDSHAKE, e, req);
        }

      } else {
        req = this.requests.get(socket);

        if (!req) {
          req = new Request(socket);
          this.requests.set(socket, req);
        }

        this._decodeFrame(data);

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

  _decodeFrame(buf) {
    const FIN = (buf[0] & 128);
    console.log('FIN', FIN);
    const RSV1 = (buf[0] & 64);
    console.log('RSV1', RSV1);
    const RSV2 = (buf[0] & 32);
    console.log('RSV2', RSV2);
    const RSV3 = (buf[0] & 16);
    console.log('RSV3', RSV3);
    const Opcode = (buf[0] & 15);
    console.log('Opcode', Opcode);
    const mask = (buf[1] & 128);
    console.log('mask', mask);
    const length = (buf[1] & 127);
    console.log('length', length);

    const maskingKey = buf.slice(2, 6); // look @ https://github.com/broofa/node-int64

    const encoded = buf.slice(6);
    let decoded = Buffer.allocUnsafe(encoded.length);

    for (var i = 0; i < encoded.length; i++) {
      decoded[i] = encoded[i] ^ maskingKey[i % 4];
    }

    return decoded.toString('utf8');
  }

  // _isGet(req) {
  //   return req.method === GET;
  // }
  //
  // _isNewerVersion(req) {
  //   return req.httpVersion >= 1.1;
  // }
  //
  // _isHostSet(req) {
  //   console.log('host', req.host);
  //   return req.host && 1;
  // }
  //
  // _isWSUpgradeReq(req) {
  //   return req.connection.indexOf(UPGRADE) !== -1 &&
  //          req.upgrade == WEBSOCKET;
  // }
  //
  // _isWSKeySet(req) {
  //   console.log(req.secWSKey && 1);
  //   return req.secWSKey && 1;
  // }
  //
  // _isRightWSKeyVersion(req) {
  //   console.log(req.secWSVersion && 1);
  //   return req.secWSVersion && 1;
  // }
  //
  // hasValidHeaders(req) {
  //   console.log(req.headers);
  //   return this._isGet(req) &&
  //          this._isNewerVersion(req) &&
  //          this._isHostSet(req) &&
  //          this._isWSUpgradeReq(req) &&
  //          this._isWSKeySet(req) &&
  //          this._isRightWSKeyVersion(req);
  // }
}

module.exports = RequestHandler;

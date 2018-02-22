const {
  DATA,
  HANDSHAKE,
  GET,
  HTTP_VERSION_REGEX,
  UPGRADE,
  WEBSOCKET, } = require('./constants');
const Request = require('./request');

class RequestHandler {
  constructor(server, options = {}) {
    this._server = server;
    this.requests = new Map();
  }

  handle(socket) {
    socket.on(DATA, (data) => {
      let req;
      let strData = data.toString();

      if (this._isHandShake(strData)) {
        req = new Request(socket);
        this.requests.set(socket, req);

        req.rawHeaders = strData;
        req.headers = this._parseHeader(strData);
        this._server.emit(HANDSHAKE, req);

      } else {
        req = this.requests.get(socket);
        if (!req) req = new Request(socket);
      }

    });
  }

  _isHandShake(str) {
    return /^\s*GET/.test(str);
  }

  _parseHeader(rawHeaders) {
    const headers = {};
    const tmp = rawHeaders.trim().split('\r\n');
    this._parseRequestLine(tmp.shift(), headers);

    tmp.map(ln => ln.split(': '))
        .forEach(([key, val]) => {
          headers[key.trim()] = val.trim();
        });

    return headers;
  }

  _parseRequestLine(line, headers) {
    let _line = line.split(' ');
    headers.method = _line[0];
    headers.url = _line[1];
    headers.httpVersion = _line[2];
  }

  _decodeMessage(buf) {
    const FIN = (buf[0] & 128);
    const RSV1 = (buf[0] & 64);
    const RSV2 = (buf[0] & 32);
    const RSV3 = (buf[0] & 16);
    const Opcode = buf[0] & 15;
    const mask = (buf[1] & 128);
    const length = (buf[1] & 127);

    const maskingKey = buf.slice(2, 6); // look @ https://github.com/broofa/node-int64

    const encoded = buf.slice(6);
    let decoded = Buffer.allocUnsafe(encoded.length);

    for (var i = 0; i < encoded.length; i++) {
      decoded[i] = encoded[i] ^ maskingKey[i % 4];
    }

    decoded.toString('utf8');
  }

  _isGet(req) {
    return req.method === GET;
  }

  _isNewerVersion(req) {
    return req.httpVersion &&
           HTTP_VERSION_REGEX.test(req.headers.httpVersion) &&
           parseInt(req.version.split('/')[1]) >= 1.1;
  }

  _isHostSet(req) {
    console.log(req.host && 1);
    return req.host && 1;
  }

  _isWSUpgradeReq(req) {
    console.log(req.connection == UPGRADE && req.upgrade == WEBSOCKET);
    return req.connection == UPGRADE &&
           req.upgrade == WEBSOCKET;
  }

  _isWSKeySet(req) {
    console.log(req.secWSKey && 1);
    return req.secWSKey && 1;
  }

  _isRightWSKeyVersion(req) {
    console.log(req.secWSVersion && 1);
    return req.secWSVersion && 1;
  }

  hasValidHeaders(req) {
    console.log(req.headers);
    return this._isGet(req) &&
           this._isNewerVersion(req) &&
           this._isHostSet(req) &&
           this._isWSUpgradeReq(req) &&
           this._isWSKeySet(req) &&
           this._isRightWSKeyVersion(req);
  }
}

module.exports = RequestHandler;

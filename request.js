const {
  SEC_WS_KEY,
  SEC_WS_VERSION, } = require('./constants');
const EventEmitter = require('events');

class Request {
  constructor(socket) {
    this.socket = socket;
    this._payload = null;
    this._chunks = [];
    this._buffer = null;
    this.headers = {};
  }

  get host() {
    return this.headers.Host;
  }

  get httpVersion() {
    return parseInt(`${this.headers.version.major}.${this.headers.version.minor || 0}`);
  }

  get method() {
    return this.headers.method;
  }

  get url() {
    return this.headers.url;
  }

  get secWSKey() {
    return this.headers[SEC_WS_KEY];
  }

  get secWSVersion() {
    return this.headers[SEC_WS_VERSION];
  }

  get connection() {
    return this.headers.connection;
  }

  get upgrade() {
    return this.headers.upgrade;
  }

  get payload() {
    if (!this._payload) {
      // this._payload = Buffer.concat(this._chunks);
    }

    return this._payload;
  }

  get buffer() {
    if (!this._buffer)
      this._buffer = Buffer.concat(this._chunks);

    return this._buffer;
  }

  push(data) {
    this._chunks.push(data);
  }
}

module.exports = Request;

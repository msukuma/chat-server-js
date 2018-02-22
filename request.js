const {
  SEC_WS_KEY,
  SEC_WS_VERSION, } = require('./constants');
const EventEmitter = require('events');

class Request {
  constructor(socket) {
    this._socket = socket;
    this._payloads = [];
    this._rawHeaders = null;
    this._headers = null;

  }

  get socket() {
    return this._socket;
  }

  get rawHeaders() {
    return this._rawHeaders;
  }

  set rawHeaders(raw) {
    this._rawHeaders = raw;
  }

  get headers() {
    return this._headers;
  }

  set headers(hdrs) {
    this._headers = hdrs;
  }

  get host() {
    return this._headers &&
           this._headers.host;
  }

  get httpVersion() {
    return this._headers &&
           this._headers.httpVersion.split('/')[1];
  }

  get method() {
    return this._headers.method &&
           this._headers.method;
  }

  get url() {
    return this.headers &&
           this.headers.url;
  }

  get secWSKey() {
    return this.headers &&
           this.headers[SEC_WS_KEY];
  }

  get secWSVersion() {
    return this.headers &&
           this.headers[SEC_WS_VERSION];
  }

  get connection() {
    return this.headers &&
           this.headers.connection;
  }

  get upgrade() {
    return this.headers &&
           this.headers.Upgrade;
  }

  get payload() {
    return Buffer.concat(this._payloads);
  }
}

module.exports = Request;

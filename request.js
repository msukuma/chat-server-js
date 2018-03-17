const {
  SEC_WS_KEY,
  SEC_WS_VERSION, } = require('./constants');
const EventEmitter = require('events');

class Request {
  constructor(socket) {
    this.socket = socket;

    this._body = null;
    this._frames = [];
    this._buffer = null;

    this.headers = {};
    this.method = null;
    this.url = null;
    this.httpVersion = null;
  }

  get host() {
    return this.headers.host;
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

  get message() {
    if (!this._body) {
      try {
        this._body = JSON.parse(this.buffer.toString());
      } catch (e) {
        this._body = this.buffer.toString();
      }
    }

    return this._body;
  }

  get buffer() {
    let totalLength;

    if (!this._buffer) {
      totalLength = 0;

      this._buffer = Buffer.concat(
        this._frames.map(frame => {
          totalLength += frame.payloadLength;
          return frame.payload;
        }),
        totalLength
      );
    }

    return this._buffer;
  }

  get frames() {
    return this._frames;
  }

  get lastFrame() {
    return this._frames[this._frames.length - 1];
  }

  addFrame(frame) {
    this._frames.push(frame);
  }

  isNewRequest() {
    return this._frames.length === 0;
  }
}

module.exports = Request;

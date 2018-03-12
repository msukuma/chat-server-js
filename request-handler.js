const {
  DATA,
  GET,
  MESSAGE,
  MESSAGE_PROP_TYPES,
  COMPLETE,
  TEXT,
  WS_CLOSE,
  PING,
  PONG,
  CONTINUATION,
  TIMEOUT,
  REQUEST_TIMEOUT,
  HANDSHAKE,
  HANDSHAKE_REGEX,
  HTTP_VERSION_REGEX,
  UPGRADE,
  WEBSOCKET, } = require('./constants');
const {
  HandshakeError,
  MessageError,
  FrameError, } = require('./errors');
const { byteSize } = require('./util');
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
      let frame;
      let headers;
      let str = buf.toString().trim();

      if (this._isNewHandShake(socket, str)) {
        req = new Request(socket);
        console.log(str);
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
          // this._monitor(req);
        }
        // cases
        // 1 - Req is one frame and tcp does not split
        // 2 - req is one frame and tcp splits
        // *
        // 3 - req in fragmented and tcp does not split any of them
        // * if is first frame
        // * else
        //

        // 4 - req in fragmented and tcp splits one or more
        // 5 - req is never completed by client, debounce lol * handled

        console.log('req._frames=========', req._frames);
        if (req.isNewRequest()) {
          console.log('============new reqest new frame=======================');
          frame = new Frame(buf);
          req.addFrame(frame);
        } else {
          frame = req.lastFrame;

          if (frame.isComplete()) {
            console.log('============old request new frame=======================');
            frame = new Frame(buf);
            req.addFrame(frame);
          } else {
            frame.concat(buf);
            if (frame.variablePayloadLength > frame.payloadLength) {
              return this._server.emit(
                MESSAGE,
                new FrameError('Frame payload size bigger than expected'),
                req
              );
            }
          }
        }

        // how node handles large tcp payloads differs from the websocket Protocol
        // so a client might send a single frame but the server might recieve/process
        // it as multiple chunks. so we have to check;
        if (frame.isComplete()) {
          console.log('====================frame is complete========================================');
          try { // check frame
            // console.log(frame.payload.toString());
            this._validateFrame(frame);
          } catch (e) {
            console.log(e);
            return this._server.emit(MESSAGE, e, req);
          }

          // check frame done

          if (frame.fin) {
            console.log('fin frame=========', frame);
            console.log('fin req.frames=========', req._frames);

            if (frame.opcode === TEXT || frame.opcode === CONTINUATION) {
              try {
                this._validateMessage(req.message);
                return this._server.emit(MESSAGE, null, req);
              } catch (e) {
                return this._server.emit(MESSAGE, e, req);
              }
            } else {
              return this._server.emit(frame.opcode, req);
            }
          }
        }
      }
    });
  }

  complete(req) {
    this.requests.update(req.socket, null);
  }

  _monitor(req) {
    setTimeout(() => {
      if (this.requests.exists(req.socket) && this.requests.get(socket) === req) {
        this._server.emit(TIMEOUT);
      }
    }, REQUEST_TIMEOUT);
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
    Object.entries(MESSAGE_PROP_TYPES)
          .forEach(([key, type]) => {
            if (!msg.hasOwnProperty(key) || typeof msg[key] !== type)
              throw new MessageError(k);
          });
  }
}

module.exports = RequestHandler;

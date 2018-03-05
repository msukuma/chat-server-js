const {
  MESSAGE,
  ERROR,
  TIMEOUT,
  END,
  DATA,
  GET,
  CONNECTION,
  LISTENING,
  CLOSE,
  SESSION,
  BAD_REQUEST,
  WS_CLOSE,
  PING,
  PONG,
  COMPLETE,
  HANDSHAKE,
  BAD_HANDSHAKE_RESPONSE,
  GOOD_HANDSHAKE_RESPONSE_PREFIX,
  GOOD_HANDSHAKE_RESPONSE_SUFFIX,
  GUID,
} = require('./constants');
const { HandshakeError } = require('./errors');
const Logger = require('./logger');
const Sessions = require('./sessions');
const ResponseHandler = require('./response-handler');
const httpHeaders = require('http-headers');
const RequestHandler = require('./request-handler');
const Frame = require('./frame');
const net = require('net');
const url = require('url');
const crypto = require('crypto');

class ChatServer extends net.Server {
  constructor(cl, options = {}) {
    super(options, cl);
    this.id = options.id || Date.now();
    this.log = Logger();
    this.sessions = new Sessions(this.log);
    this.requests = this.sessions;
    this.responder = new ResponseHandler(this);
    this.requestHandler = new RequestHandler(this);

    this._init();
  }

  _init() { //eventually all this will move out;
    this._onListening();
    this._onConnection();
    this._onError();
    this._onClose();

    this._onHandShake();
    this._onMessage();
    this._onWsClose();
    this._onPING();
    this._onPONG();
    // this._onComplete();
  }

  _onListening() {
    this.on(LISTENING, () => {
      const info = this.address();
      info.type = LISTENING;
      this.log.info(info);
    });
  }

  _onConnection() {
    this.on(CONNECTION, socket => {
      this.requestHandler.handle(socket);

      socket.setTimeout(180000);

      socket.on(TIMEOUT, () => {
        this.log.timeout({ socketId: socket.id });
        this._endConnection(socket);
      });

      socket.on(ERROR, err => {
        this.log.error({
          source: 'socket',
          socketId: socket.id,
          error: err.stack,
        });
      });

      socket.on(END, () => {
        this._endConnection(socket);
      });
    });
  }

  _onError() {
    this.on(ERROR, err => {
      this.log.error({
        source: 'server',
        serverId: this.id,
        error: err.stack,
      });
    });
  }

  _onClose() {
    this.on(CLOSE, () => {
      const info = this.address();
      info.type = CLOSE;
      this.log.info(info);
    });
  }

  _onHandShake() { // use ResponseHandler
    this.on(HANDSHAKE, (err, req) => {
      if (err)
        return req.socket.end(BAD_HANDSHAKE_RESPONSE);

      const userId = url.parse(req.url).pathname.split('/')[2];
      const resp = GOOD_HANDSHAKE_RESPONSE_PREFIX +
                   this._acceptHash(req) +
                   GOOD_HANDSHAKE_RESPONSE_SUFFIX;

      req.socket.write(resp, () => this.sessions.add(req, userId));
    });
  }

  _onMessage() {
    this.on(MESSAGE, (err, req) => {
      console.log('MESSAGE', err);
      if (err)
        return this.responder.error(req.socket, err)
                    .then(() => this.requestHandler.complete(req));

      this.responder
          .broadcast(req, () => this.requestHandler.complete(req));
    });
  }

  _onWsClose() {
    this.on(WS_CLOSE, (req) => this.sessions.end(req.socket));
  }

  _onPING() {
    this.on(PING, (req) => this.responder.pong(req));
  }

  _onPONG() {
    this.on(PONG, (req) => this.responder.ping(req));
  }

  // _onComplete() {
  //   this.on(COMPLETE, (req) => this.requestHandler.complete(req));
  // }

  _acceptHash(req) {
    return crypto
      .createHash('sha1')
      .update(req.secWSKey + GUID)
      .digest('base64');
  }

  _endConnection(socket, reason) {
    this.sessions.end(socket);
    socket.destroy();
  }
}

module.exports = ChatServer;

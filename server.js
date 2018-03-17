const {
  SOCKET,
  SERVER,
  MESSAGE,
  ERROR,
  TIMEOUT,
  SOCKET_TIMEOUT,
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
} = require('./constants');
const { HandshakeError } = require('./errors');
const Logger = require('./logger');
const Sessions = require('./sessions');
const ResponseHandler = require('./response-handler');
const httpHeaders = require('http-headers');
const RequestHandler = require('./request-handler');
const Frame = require('./frame');
const url = require('url');
const net = require('net');

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

      socket.setTimeout(SOCKET_TIMEOUT);

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
        source: SERVER,
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
        this.responder
            .badHandshake(req)
            .then(() => req.socket.end());

      this.responder
          .goodHandshake(req)
          .then(() => {
            const userId = url.parse(req.url).pathname.split('/')[2];
            this.sessions.add(req, userId);
          });
    });
  }

  _onMessage() {
    this.on(MESSAGE, (err, req) => {
      if (err) {
        console.log('MESSAGE', err);
        this.log.message({
          type: ERROR,
          error: err.stack,
          source: SOCKET,
          socketId: req.socket.id,
          serverId: this.id,
        });

        return this.responder.error(req.socket, err)
                   .then(() => this.requestHandler.complete(req));

      }

      this.responder
          .broadcast(req)
          .then(() => {
            this.requestHandler.complete(req);
          });
    });
  }

  _onWsClose() {
    this.on(WS_CLOSE, (req) => {
      this.log.message({
        type: CLOSE,
        content: req.message,
      });

      this.sessions.end(req.socket);
    });
  }

  _onPING() {
    this.on(PING, (req) => {
      let ctrlMsg = { type: PING, content: req.message };
      this.log.message(ctrlMsg);

      this.responder
          .pong(req)
          .then(() => {
            this.requestHandler.complete(req);
            ctrlMsg.type = PONG;
            this.log.message(ctrlMsg);
          });
    });
  }

  _onPONG() {
    this.on(PONG, (req) => {
      this.respoonder
          .pong(req)
          .then(() => {
            this.requestHandler.complete(req);
            this.log.message({
              type: PONG,
              content: req.message,
            });
          });
    });
  }

  _endConnection(socket, reason) {
    this.sessions.end(socket);
    socket.destroy();
  }
}

module.exports = ChatServer;

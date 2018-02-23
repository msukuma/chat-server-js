const {
  MESSAGE,
  ERROR,
  TIMEOUT,
  END,
  DATA,
  CONNECTION,
  LISTENING,
  CLOSE,
  SESSION,
  BAD_REQUEST,
  HANDSHAKE,
  BAD_HANDSHAKE_RESPONSE,
  GOOD_HANDSHAKE_RESPONSE_PREFIX,
  GOOD_HANDSHAKE_RESPONSE_SUFFIX,
  GUID,
} = require('./constants');
const { inherit } = require('./util');
const Logger = require('./logger');
const Connections = require('./connections');
const Sessions = require('./sessions');
const Messages = require('./messages');
const RequestHandler = require('./request-handler');
const net = require('net');
const crypto = require('crypto');

class ChatServer {
  constructor(cl, options = {}) {
    inherit(this, net.createServer(cl, options));
    this.id = options.id || Date.now();
    this.log = Logger();
    this.connections = new Connections(this.log);
    this.sessions = new Sessions(this.log);
    this.messages = new Messages(this);
    this.requestHandler = new RequestHandler(this);

    this._init();
  }

  _init() {
    this._onListening();
    this._onConnection();
    this._onError();
    this._onClose();

    this._onHandShake();
    this._onMessage();
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
        this.log.timeout({
          socketId: socket.id,
        });
        this._endConnection(socket);
      });

      socket.on(ERROR, err => {
        this.log.error({
          source: 'socket',
          socketId: socket.id,
          content: err.stack,
        });
      });

      socket.on(END, () => this._endConnection(socket));
    });
  }

  _handleSession(socket, data) {
    this.sessions.add(socket, data.userId);
  }

  _handleMessage(socket, message) {
    if (this.messages.valid(message)) {
      this.messages
        .receive(socket, message)
        .then(this.messages.broadcast(socket, message));
    } else {
      this.messages.error(socket, 'InvalidFormat');
    }
  }

  _onError() {
    this.on(ERROR, err => {
      this.log.error({
        serverId: this.id,
        content: err.message,
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

  _onHandShake() {
    this.on(HANDSHAKE, req => {
      if (this.requestHandler.hasValidHeaders(req)) {
        this._acceptConnection(req);
      } else {
        this._badRequest(req.socket);
      }
    });
  }

  _onMessage() {
    this.on(MESSAGE, (socket, message) => {
      this.messages.receive(socket, message);
      this.messages.broadcast(socket, message);
    });
  }

  _badRequest(socket) {
    // move this to connections?
    socket.write(BAD_HANDSHAKE_RESPONSE);

    this.log.connection({
      type: BAD_REQUEST,
      socketId: socket.id,
      address: socket.address(),
    });

    this._endConnection(socket);
  }

  _acceptConnection(req) {
    // move this to connections?
    req.socket.write(
      GOOD_HANDSHAKE_RESPONSE_PREFIX +
      this._acceptHash(req) +
      GOOD_HANDSHAKE_RESPONSE_SUFFIX
    );

    this.connections.add(req.socket);
  }

  _acceptHash(request) {
    // move this to connections?
    return crypto
      .createHash('sha1')
      .update(request.secWSKey + GUID)
      .digest('base64');
  }

  _endConnection(socket) {
    this.sessions.end(socket);
    this.connections.end(socket);
  }
}

module.exports = ChatServer;

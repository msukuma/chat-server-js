const {
  MESSAGE,
  ERROR,
  TIMEOUT,
  END,
  DATA,
  CONNECTION,
  LISTENING,
  CLOSE,
  SESSION, } = require('./constants');
const { inherit } = require('./util');
const Logger = require('./logger');
const Connections = require('./connections');
const Sessions = require('./sessions');
const Messages = require('./messages');
const net = require('net');

class ChatServer {
  constructor(cl, options = {}) {
    inherit(this, net.createServer(cl, options));
    this.id = options.id || Date.now();
    this.log = Logger();
    this.connections = new Connections(this.log);
    this.sessions = new Sessions(this.log);
    this.messages = new Messages(this);

    this._init();
  }

  _init() {
    this._onListening();
    this._onConnection();
    this._onError();
    this._onClose();
  }

  _onListening() {
    this.on(LISTENING, () => {
      const info = this.address();
      info.type = LISTENING;
      this.log.info(info);
    });
  }

  _onConnection() {
    this.on(CONNECTION, (socket) => {
      this.connections.add(socket);
      this._configureSocket(socket);
    });
  }

  _configureSocket(socket) {
    socket.setTimeout(180000);

    socket.on(TIMEOUT, () => {
      this.log.timeout({ socketId: socket.id });

      this.sessions.end(socket);
      this.connections.end(socket);
    });

    socket.on(DATA, (chunk) => {
      const data = JSON.parse(chunk.toString());

      switch (data.type) {
        case SESSION:
          this._handleSession(socket, data);
          break;
        case MESSAGE:
          this._handleMessage(socket, data);
          break;
      }
    });

    socket.on(ERROR, err => {
      this.log.error({
        source: 'socket',
        socketId: socket.id,
        message: err.message,
      });
    });

    socket.on(END, () => {
      this.sessions.end(socket);
      this.connections.end(socket);
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
}

module.exports = ChatServer;

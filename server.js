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
const ConnectionsManager = require('./connections');
const SessionsManager = require('./sessions');
const MessagesManager = require('./messages');
const net = require('net');

class ChatServer {
  constructor(cl, options = {}) {
    inherit(this, net.createServer(cl, options));
    this.id = options.id || Date.now();
    this.log = Logger();
    this.connections = new ConnectionsManager(this.log);
    this.sessions = new SessionsManager(this.log);
    this.messages = new MessagesManager(this);

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

      if (data.type === SESSION) {
        this.sessions.add(socket, data.userId);
      } else if (data.type === MESSAGE) {
        if (this.messages.valid(data)) {
          this.messages.broadcast(socket, data);
        } else {
          this.messages.error(socket, 'InvalidFormat');
        }
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

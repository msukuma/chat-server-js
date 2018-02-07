const { inherit } = require('./util');
const Logger = require('./logger');
const ConnectionManager = require('./connections');
const SessionManager = require('./sessions');
const net = require('net');

class ChatServer {
  constructor(cl, opts = {}) {
    inherit(this, net.createServer(cl, opts));
    this.log = Logger();
    this.connections = new ConnectionManager();
    this.sessions = new SessionManager();
    this.medium = new Medium(this);

    this._init();
  }

  _init() {
    this._onConnection();
    this._onError();

  }

  _onConnection() {
    this.on('connection', (socket) => {
      this.connections.add(socket);
      this._configureSocket(socket);
    });
  }

  _configureSocket(socket) {
    socket.setTimeout(180000);

    socket.on('timeout', () => {
      event = { type: 'timeout', socket: socket.id };
      this.log(JSON.stringify(event));

      this.sessions.end(socket);
      this.connections.end(socket);
    });

    socket.on('data', (chunk) => {
      const data = chunk.toString();
      this.medium.broadcast(socket, data);
    });

    socket.on('error', err => this.log.error(err.message));
    socket.on('end', () => {
      this.killSession(socket);
    });
  }

  _onError() {
    this.on('error', err => this.log.error(err.message));
  }
}

module.exports = ChatServer;

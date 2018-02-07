const { inherit } = require('./util');
const ConnectionManager = require('./connections');
const SessionManager = require('./sessions');
const net = require('net');

class ChatServer {
  constructor(cl, opts = {}) {
    this.connections = new ConnectionManager();
    this.sessions = new SessionManager();

    inherit(this, this._server, net.createServer(cl, opts));
  }
};

module.exports = ChatServer;

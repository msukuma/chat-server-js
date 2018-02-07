const { inherit } = require('./util');
const net = require('net');

class ChatServer {
  constructor(options = {}) {
    inherit(this, net.createServer(options, this.connectionListener));
  }

}

module.exports = ChatServer;

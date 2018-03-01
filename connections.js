const { ADD, END } =  require('./constants');

class Connections {
  constructor(logger, options = {}) {
    this.log = logger;
    this._tmp_id = 0;
    this._connections = new Set();
  }

  _log(socket, type) {
    this.log.connection({
      type: type,
      socketId: socket.id,
      address: socket.address(),
    });
  }

  add(socket) {
    socket.id = this._tmp_id++;
    this._connections.add(socket);
    this._log(socket, ADD);
  }

  has(socket) {
    return this._connections.has(socket);
  }

  end(socket, reason) {
    socket.destroy();
    this._connections.delete(socket);
    this._log(socket, END);
  }

  endAll() {
    this._connections.forEach(this.end);
    this._connections.clear();
  }

  forEach(fn) {
    this._connections.forEach(fn);
  }
}

module.exports = Connections;

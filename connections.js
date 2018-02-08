const { ADD, END } =  require('./constants');

class Connections {
  constructor(logger, options = {}) {
    this.log = logger;
    this._tmp_id = 0;
    this.connections = new Set();
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
    this.connections.add(socket);
    this._log(socket, ADD);
  }

  end(socket) {
    this.connections.delete(socket);
    socket.destroy();
    this._log(socket, END);
  }

  endAll() {
    this.connections.forEach(socket => socket.destroy());
    this.connections.clear();
  }

  forEach(fn) {
    this.connections.forEach(fn);
  }
}
module.exports = Connections;

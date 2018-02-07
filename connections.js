class ConnectionManager {
  constructor(options = {}) {
    this._tmp_id = 0;
    this.connections = new Set();
  }

  add(socket) {
    socket.id = this._tmp_id++;
    this.connections.add(socket);
  }

  end(socket) {
    this.connections.delete(socket);
    socket.destroy();
  }

  endAll() {
    this.connections.forEach(c => socket.destroy());
    this.connections.clear();
  }
}
module.exports = ConnectionManager;

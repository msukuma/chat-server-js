const { ADD, END } =  require('./constants');

class Sessions {
  constructor(logger) {
    this.log = logger;
    this.numSessions = 0;
    this.sessions = new Map();
  }

  _log(socket, type) {
    this.log.session({
      type: type,
      userId: socket.userId,
      socketId: socket.id,
      address: socket.address(),
    });
  }

  exists(socket) {
    return this.sessions.has(socket);
  }

  get(socket) {
    return this.sessions.get(socket);
  }

  add(req, userId) {
    req.socket.userId = userId;
    this.sessions.set(req.socket, req);
    this._log(req.socket, ADD);
  }

  update(socket, req) {
    if (!this.exists(socket))
      throw new Error('Socket is not in session');
    this.sessions.set(socket, req);
  }

  end(socket) {
    this.sessions.delete(socket);
    this._log(socket, END);
  }

  endAll() {
    this.sessions.clear();
  }

  forEach(fn) {
    this.sessions.forEach(fn);
  }
};

module.exports = Sessions;

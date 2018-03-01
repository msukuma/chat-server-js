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
    return this.sessions.has(socket.userId);
  }

  add(socket, userId) {
    socket.userId = userId;
    this.sessions.set(userId, socket);
    this._log(socket, ADD);
  }

  end(socket) {
    this.sessions.delete(socket.userId);
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

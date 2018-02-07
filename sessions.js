class SessionManager {
  constructor(server) {
    this.numSessions = 0;
    this.sessions = new Map();
  }

  exists(socket) {
    const id = typeof socket == 'string' ? socket : socket.id;
    return this.sessions.has(id);
  }

  start(socket) {
    this.sessions.set(socket.userId, socket);
  }

  end(socket) {
    this.session.delete(socket.userId);
  }

  endAll() {
    this.sessions.clear();
  }

  forEach(fn) {
    this.sessions.forEach(fn);
  }
};

module.exports = SessionManager;

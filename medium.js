const {
  MESSAGE,
  INFO,
  WARNING,
  ERROR, } = require('./constants');

class Medium {
  constructor(server, options = {}) {
    this._server = server;
  }

  _write(socket, dataObj) {
    socket.write(JSON.stringify(dataObj));
  }

  _serverMessage(socket, { type, message }) {
    this._write(socket, {
      type: type,
      message: message,
      time: new Date().toISOString(),
    });
  }

  broadcast({ socket, message, time }) {
    let data = {
      type: MESSAGE,
      from: socket.userId,
      message: message,
      time: time,
    };

    this._server.sessions.forEach((skt, id) => {
      if (socket.id !== id) this._write(skt, data);
    });
  }

  info({ socket, message }) {
    this._serverMessage(socket, {
      type: INFO,
      message: message,
    });
  }

  warn({ socket, message }) {
    this._serverMessage(socket, {
      type: WARNING,
      message: message,
    });
  }

  error({ socket, message }) {
    this._serverMessage(socket, {
      type: ERROR,
      message: message,
    });
  }
}

module.exports = Medium;

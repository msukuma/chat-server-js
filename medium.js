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

  _serverMessage(socket, { type, content }) {
    this._write(socket, {
      type: type,
      content: content,
      time: new Date().toISOString(),
    });
  }

  broadcast({ socket, content, time }) {
    let data = {
      type: MESSAGE,
      from: socket.userId,
      content: content,
      time: time,
    };

    this._server.sessions.forEach((skt, id) => {
      if (socket.id !== id) this._write(skt, data);
    });
  }

  info({ socket, content }) {
    this._serverMessage(socket, {
      type: INFO,
      content: content,
    });
  }

  warn({ socket, content }) {
    this._serverMessage(socket, {
      type: WARNING,
      content: content,
    });
  }

  error({ socket, content }) {
    this._serverMessage(socket, {
      type: ERROR,
      content: content,
    });
  }
}

module.exports = Medium;

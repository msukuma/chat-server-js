class HandshakeError extends Error {
  constructor(msg) {
    super();
    this.name = 'HandshakeError';
    this.message = msg;
  }
}

class MessageError extends Error {
  constructor(key) {
    super();
    this.name = 'MessageError';
    this.message = `missing or invalid key: message.${key}`;
  }
}

class FrameError extends Error {
  constructor(msg) {
    super();
    this.name = 'FrameError';
    this.message = msg;
  }
}

module.exports = {
  HandshakeError: HandshakeError,
  MessageError: MessageError,
  FrameError: FrameError,
};

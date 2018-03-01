class HandshakeError extends Error {
  constructor(message) {
    super(message);
  }
}

module.exports.HandshakeError = HandshakeError;

const constants = {
  ERROR: 'error',
  TIMEOUT: 'timeout',
  DATA: 'data',
  LISTENING: 'listening',
  CLOSE: 'close',
  CONNECTION: 'connection',
  SESSION: 'session',
  WARNING: 'warning',
  MESSAGE: 'message',
  STATUS: 'status',
  INFO: 'info',
  ADD: 'add',
  END: 'end',
  GET: 'GET',
  FIN_CHECK: 128,
  RSV1_CHECK: 64,
  RSV2_CHECK: 32,
  RSV3_CHECK: 16,
  OPCODE_CHECK: 15,
  MASK_CHECK: 128,
  PAYLOAD_LENGTH_CHECK: 127,
  MASKING_KEY_LENGTH: 4,
  HANDSHAKE: 'handshake',
  HANDSHAKE_REGEX: /^GET/,
  BAD_REQUEST: 'Bad Request',
  BAD_HANDSHAKE_RESPONSE: 'HTTP/1.1 400 Bad Request\r\n',
  GOOD_HANDSHAKE_RESPONSE_PREFIX: 'HTTP/1.1 101 Switching Protocols\r\n' +
   'Upgrade: websocket\r\n' +
   'Connection: Upgrade\r\n' +
   'Sec-WebSocket-Protocol: chat\r\n' +
   'Sec-WebSocket-Accept: ',
  GOOD_HANDSHAKE_RESPONSE_SUFFIX: '\r\n\r\n',
  HTTP_VERSION_REGEX: /HTTP\/\d/,
  UPGRADE: 'upgrade',
  WEBSOCKET: 'websocket',
  SEC_WS_KEY: 'sec-websocket-key',
  SEC_WS_VERSION: 'sec-websocket-version',
  GUID: '258EAFA5-E914-47DA-95CA-C5AB0DC85B11',
  HOST: 'localhost',
  PORT: 56150,
};

constants. MESSAGE_KEYS = [
  'type',
  'content',
  'from',
  'timestamp',
];

module.exports = constants;

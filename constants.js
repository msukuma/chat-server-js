const constants = {
  SERVER: 'server',
  ERROR: 'error',
  TIMEOUT: 'timeout',
  DATA: 'data',
  LISTENING: 'listening',
  CLOSE: 'close',
  CONNECTION: 'connection',
  SESSION: 'session',
  WARNING: 'warning',
  MESSAGE: 'message',
  COMPLETE: 'complete',
  STATUS: 'status',
  DELIVERED: 'delivered',
  INFO: 'info',
  ADD: 'add',
  END: 'end',
  GET: 'GET',
  FIN_AND: 128,
  RSV1_AND: 64,
  RSV2_AND: 32,
  RSV3_AND: 16,
  OPCODE_AND: 15,
  MASK_AND: 128,
  PAYLOAD_LENGTH_AND: 127,
  MAX_PAYLOAD_LENGTH: 5242880, //5mb
  MASKING_KEY_LENGTH: 4,
  TEXT: 1,
  WS_CLOSE: 8,
  PING: 9,
  PONG: 10,
  HANDSHAKE: 'handshake',
  HANDSHAKE_REGEX: /^GET/,
  BAD_REQUEST: 'Bad Request',
  BAD_HANDSHAKE_RESPONSE: 'HTTP/1.1 400 Bad Request\r\n',
  GOOD_HANDSHAKE_RESPONSE_PREFIX: 'HTTP/1.1 101 Switching Protocols\r\n' +
   'Upgrade: websocket\r\n' +
   'Connection: Upgrade\r\n' +
   'Sec-WebSocket-Protocol: chat\r\n' +
   'Sec-WebSocket-Version: 13\r\n' +
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

constants.MESSAGE_KEYS = [
  'type',
  'content',
  'from',
  'timestamp',
];

module.exports = constants;

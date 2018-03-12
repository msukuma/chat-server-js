const constants = {
  STRING: 'string',
  SERVER: 'server',
  ERROR: 'error',
  SOCKET_TIMEOUT: 180000,
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
  FIN_AND: 0x80,
  RSV1_AND: 0x40,
  RSV2_AND: 0x20,
  RSV3_AND: 0x10,
  OPCODE_AND: 0xf,
  PAYLOAD_LENGTH_AND: 0x7f,
  MAX_PAYLOAD_LENGTH: 5242880, //5mb
  MASKING_KEY_LENGTH: 4,
  TEXT: 0x1,
  CONTINUATION: 0x0,
  WS_CLOSE: 0x8,
  PING: 0x9,
  PONG: 0xa,
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

constants.MASK_AND = constants.FIN_AND;
constants.REQUEST_TIMEOUT = constants.SOCKET_TIMEOUT / 18;
constants.MESSAGE_PROP_TYPES = {
  type: constants.STRING,
  content: constants.STRING,
  from: 'number',
  timestamp: constants.STRING,
};

module.exports = constants;

const assert = require('assert');

exports.FIN = 'fin';
exports.OPCODE = 'opcode';
exports.MASK = 'mask';
exports.PAYLOAD = 'payload'

exports.getPayload = (size = 128) => {
  if (size % 4 !== 0)
    throw new Error();

  const buf = Buffer.alloc(size);

  for (let i = 0; i < size; i += 4) {
    buf.writeUInt32BE(0x68657921, i);
  }

  return buf;
};

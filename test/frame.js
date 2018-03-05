const faker = require('faker');
const assert = require('assert');
const { createReadStream, createWriteStream } = require('fs');
const { MAX_PAYLOAD_LENGTH } = require('../constants');
const Frame = require('../frame');
let payload;

function getPayload(size = 128) {
  if (size % 4 !== 0)
    throw new Error();

  const buf = Buffer.allocUnsafe(size);

  for (let i = 0; i < size; i += 4) {
    buf.writeUInt32BE(0x68657921, i);
  }

  return buf;
}

payload = getPayload(65536);
let frame = new Frame({ payload: payload });
console.log(frame.toString());
assert(frame.fin === 1);
assert(frame.opcode === 1);
assert(frame.mask === 0);
assert(frame.payloadLength === Buffer.byteLength(payload));

const assert = require('assert');
const { createReadStream, createWriteStream } = require('fs');
const { MAX_PAYLOAD_LENGTH } = require('../constants');
const Frame = require('../frame');
// let frame;

function getPayload(size = 128) {
  if (size % 4 !== 0)
    throw new Error();

  const buf = Buffer.alloc(size);

  for (let i = 0; i < size; i += 4) {
    buf.writeUInt32BE(0x68657921, i);
  }

  return buf;
}

// function defaultTest(frame, size) {
//   assert(frame.fin === 1);
//   assert(frame.opcode === 1);
//   assert(frame.mask === 0);
//   assert(frame.payloadLength === size);
// }

function testWith(fin = 1, opcode = 1, mask = 0) {

  [64, 128, 65536].forEach(size => {
    const desc = `with options: {fin: ${fin} opcode: ${fin},` +
    ` mask: ${mask}} ,size ${size}`;

    describe(desc, () => {
      const frame = new Frame({
        payload: getPayload(size),
        fin: fin,
        opcode: opcode,
        mask: mask,
      });

      it('should set fin properly', () => assert.equal(frame.fin, fin));

      it('should set opcode properly',
          () => assert.equal(frame.opcode, opcode));

      it('should set mask properly', () => assert.equal(frame.mask, mask));

      it('should set payloadLength properly',
        () => assert.equal(frame.payloadLength, size));
    });
  });
}

describe('Frame', function () {
  testWith();
  testWith(0, 0, 0);
  testWith(0, 0, 1);
  testWith(1, 0, 0);
  testWith(1, 1, 0);
  testWith(1, 1, 1);
});

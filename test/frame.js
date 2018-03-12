const assert = require('assert');
const { createReadStream, createWriteStream } = require('fs');
const {
  FIN,
  OPCODE,
  MASK,
  getPayload,
} = require('./helpers');
const { MAX_PAYLOAD_LENGTH } = require('../constants');
const Frame = require('../frame');
const props = [FIN, OPCODE, MASK];

const setProperly = (fin, opcode, mask, size, prop) => {
  const initValues = {
    fin: fin,
    opcode: opcode,
    mask: mask,
    payload: getPayload(size),
  }
  ;
  const frame = new Frame(initValues);

  return () => {
    it('should set fin properly', () => {
      let notProp;
      assert.equal(frame[prop], initValues[prop]);
      notProp = Math.abs(frame[prop] - 1);

      frame[prop] = notProp;
      assert.equal(frame[prop], notProp);
    });

    it('should not change other prop', () => {
      props.forEach(p => {
        if (p !== prop) {
          assert.equal(frame[p], initValues[p]);
        }
      });
    });

  };
};

function testWith(fin = 1, opcode = 1, mask = 0) {
  [64, 128, 65536].forEach(size => {
    const desc = `with options: {fin: ${fin} opcode: ${fin},` +
    ` mask: ${mask}} ,size ${size}`;

    describe(desc, () => {
      describe('fin', setProperly(fin, opcode, mask, size, 'fin'));
      describe('opcode', setProperly(fin, opcode, mask, size, 'opcode'));
      describe('mask', setProperly(fin, opcode, mask, size, 'mask'));
      describe('payloadLength', () => {
        const frame  =  new Frame({
          fin: fin,
          opcode: opcode,
          mask: mask,
          payload: getPayload(size),
        });
        it('should set payloadLength properly', () => assert.equal(frame.payloadLength, size));
      });
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

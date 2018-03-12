const {
  FIN_AND,
  RSV1_AND,
  RSV2_AND,
  RSV3_AND,
  OPCODE_AND,
  MASK_AND,
  PAYLOAD_LENGTH_AND,
  MAX_PAYLOAD_LENGTH,
  MASKING_KEY_LENGTH,
} = require('./constants');
const { byteSize } = require('./util');
const { Uint64BE } = require('int64-buffer');

class Frame {
  constructor(buf) { // frame as a buffer or a plain object with properties
    this._buffer = buf instanceof Buffer ? buf : this._initBuffer(buf);
    this._fin = this._buffer[0] & FIN_AND ? 1 : 0;
    this._opcode = this._buffer[0] & OPCODE_AND;
    this._mask = this._buffer[1] & MASK_AND ? 1 : 0;
    this._iLen = this._buffer[1] & PAYLOAD_LENGTH_AND;
    this._variablePayloadLength = this.variablePayloadLength;
  }

  _initBuffer({ payload, fin = FIN_AND, opcode = 1, mask = 0 }) {// frame from server
    let extPll2msk;
    const fin2pllBuf = Buffer.alloc(2);
    const payloadBuf = payload instanceof Buffer ? payload : Buffer.from(payload);
    const buffs = [];
    const payloadLength = byteSize(payload);

    if (fin)
      fin2pllBuf[0] = 0x80;

    fin2pllBuf[0] |= opcode; // fin2opc

    if (mask)
      fin2pllBuf[1] = 0x80;

    if (payloadLength > 65535) {
      fin2pllBuf[1] |= 127; //msk2pll
      extPll2msk = new Uint64BE(payloadLength).toBuffer();
    } else if (payloadLength > 125) {
      fin2pllBuf[1] |= 126; //msk2pll
      extPll2msk = Buffer.alloc(2);
      extPll2msk.writeUInt16BE(payloadLength, 0);
    } else {
      fin2pllBuf[1] |= payloadLength; //msk2pll
    }

    buffs.push(fin2pllBuf);

    if (extPll2msk)
      buffs.push(extPll2msk);

    buffs.push(payloadBuf);

    return Buffer.concat(buffs);
  }

  get fin () {
    return this._fin;
  }

  set fin(val) {
    if (this._fin !== val) {
      if (val === 0) {
        this._buffer[0] = 0x7f & this._buffer[0];
        this._fin = 0;
      } else {
        this._buffer[0] = FIN_AND | this._buffer[0];
        this._fin = 1;
      }
    }

  }

  get opcode () {
    return this._opcode;
  }

  set opcode(val) {
    if (this._opcode !== val) {
      if (val === 0) {
        this._buffer[0] = this._buffer[0] & 0xfe;
        this._opcode = 0;
      } else {
        this._buffer[0] = this._buffer[0] | 0x01;
        this._opcode = 1;
      }
    }
  }

  get mask () {
    return this._mask;
  }

  set mask(val) {
    if (this._mask !== val) {
      if (val === 0) {
        this._buffer[1] = 0x7f & this._buffer[0];
        this._mask = 0;
      } else {
        this._buffer[1] = MASK_AND | this._buffer[0];
        this._mask = 1;
      }
    }
  }

  get maskingKey() {
    if (this._maskingKey)
      return this._maskingKey;

    if (this.mask) {
      this._maskingKey = this._buffer.slice(
        this.maskingKeyOffSet,
        this.maskingKeyOffSet + MASKING_KEY_LENGTH
      );

    }

    return this._maskingKey;
  }

  get maskingKeyOffSet() {
    if (this._maskingKeyOffSet)
      return this._maskingKeyOffSet;

    if (this.mask)
      this._maskingKeyOffSet = 2 + this.payloadLengthByteSize;

    return this._maskingKeyOffSet;
  }

  get payloadLength() {
    if (this._payloadLength)
      return this._payloadLength;

    const skip = 2;

    switch (this._iLen) {
      case 127:
        this._payloadLength = Uint64BE(this._buffer.slice(
          skip,
          skip + this._iLen)
        ).toNumber(); // not accurate
        break;
      case 126:
        this._payloadLength = this._buffer.readUInt16BE(skip) | 0;
        break;
      default:
        this._payloadLength = this._iLen;
    }

    return this._payloadLength;
  }

  get payloadLengthByteSize() {
    if (this._payloadLengthByteSize)
      return this._payloadLengthByteSize;

    switch (this._iLen) {
      case 127:
        this._payloadLengthByteSize = 8;
        break;
      case 126:
        this._payloadLengthByteSize = 2;
        break;
      default:
        this._payloadLengthByteSize = 0;
    }

    return this._payloadLengthByteSize;
  }

  get variablePayloadLength() {
    return this._buffer.length - this.payloadOffset;
  }

  get payloadOffset() {
    if (this._payloadOffset)
      return this._payloadOffset;

    if (this.mask) {
      this._payloadOffset = this.maskingKeyOffSet + MASKING_KEY_LENGTH;
    } else {
      this._payloadOffset = 2 + this._payloadLengthByteSize;
    }

    return this._payloadOffset;
  }

  get payload() {
    if (this._payload && this._payload.length === this.variablePayloadLength) {
      console.log('lengths equal');
      return this._payload;
    } else {
      console.log('NOT lengths equal');
      this._payload = this._buffer.slice(this.payloadOffset);

      if (this.mask) {
        for (let i = 0; i < this._payload.length; i++) {
          this._payload[i] = this._payload[i] ^ this.maskingKey[i % 4];
        }
      }

      return this._payload;
    }
  }

  isComplete() {
    console.log(this);
    return this.variablePayloadLength === this.payloadLength;
  }

  concat(buf) { // when frame data is split
    console.log('============concated==================');
    this._buffer =  Buffer.concat(
      [this._buffer, buf],
      this._buffer.length + buf.length
    );

    this._variablePayloadLength += buf.length;
    console.log(this);
  }

  toBuffer() {
    return this._buffer;
  }

  toString() {
    return `Frame {
      fin: ${this.fin},
      opcode: ${this.opcode},
      mask: ${this.mask},
      _iLen: ${this._iLen},
      payloadLength: ${this.payloadLength},
      payloadAsString: ${this.payload.toString('utf8')}
    }`;
  }
}

module.exports = Frame;

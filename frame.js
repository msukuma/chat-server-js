const {
  FIN_AND,
  RSV1_AND,
  RSV2_AND,
  RSV3_AND,
  OPCODE_AND,
  MASK_AND,
  PAYLOAD_LENGTH_AND,
  MASKING_KEY_LENGTH,
} = require('./constants');
const { Int64BE } = require('int64-buffer');

class Frame {
  constructor(buf) { // frame as a buffer or a plain object with properties
    this.buffer = buf instanceof Buffer ? buf : this._init(buf);

    this.fin = this.buffer[0] & FIN_AND;
    this.opcode = this.buffer[0] & OPCODE_AND;
    this.mask = this.buffer[1] & MASK_AND;
    this.payloadLength = this.buffer[1] & PAYLOAD_LENGTH_AND;
  }

  _init({ payload, fin = FIN_AND, opcode = 1 }) {// frame from server
    const buffs = [];
    const fin2OpcBuf = Buffer.allocUnsafe(2);
    let msk2pllBuf;
    const payloadBuf = payload instanceof Buffer ? payload : Buffer.from(payload);
    const payloadLength = Buffer.byteLength(payload);

    fin2OpcBuf[0] = fin | opcode;
    buffs.push(fin2OpcBuf);

    if (payloadLength > 65535) {
      fin2OpcBuf[1] = 127;
      msk2pllBuf = new Int64(payloadLength).toBuffer();
    } else if (payloadLength > 125) {
      fin2OpcBuf[1] = 126;
      msk2pllBuf = Buffer.allocUnsafe(2);
      msk2pllBuf.writeUInt16BE(payloadLength, 0);
      buffs.push(msk2pllBuf);
    } else if (payloadLength <= 125) {
      fin2OpcBuf[1] = payloadLength;
    }

    if (msk2pllBuf)
      buffs.push(msk2pllBuf);

    buffs.push(payloadBuf);

    return Buffer.concat(buffs);
  }

  get maskingKey() {
    if (this._maskingKey)
      return this._maskingKey;

    if (this.mask) {
      this._maskingKey = this.buffer.slice(
        this.maskingKeyOffSet,
        this.maskingKeyOffSet + MASKING_KEY_LENGTH
      );

    }

    return this._maskingKey;
  }

  get payloadLengthSize() {
    switch (this.payloadLength) {
      case 127:
        return 8;
      case 126:
        return 2;
      default:
        return 0;
    }
  }

  get maskingKeyOffSet() {
    if (this._maskingKeyOffSet)
      return this._maskingKeyOffSet;

    if (this.mask)
      this._maskingKeyOffSet = 2 + this.payloadLengthSize;

    return this._maskingKeyOffSet;
  }

  get payloadOffset() {
    if (this._payloadOffset)
      return this._payloadOffset;

    if (this.mask) {
      this._payloadOffset = this.maskingKeyOffSet + MASKING_KEY_LENGTH;
    } else {
      this._payloadOffset = 2 + this.payloadLengthSize;
    }

    return this._payloadOffset;
  }

  get payload() {
    if (this._payload)
      return this._payload;

    this._payload = this.buffer.slice(this.payloadOffset);

    if (this.mask) {
      for (let i = 0; i < this._payload.length; i++) {
        this._payload[i] = this._payload[i] ^ this.maskingKey[i % 4];
      }
    }

    return this._payload;
  }
}

module.exports = Frame;

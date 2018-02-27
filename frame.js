const {
  FIN_CHECK,
  RSV1_CHECK,
  RSV2_CHECK,
  RSV3_CHECK,
  OPCODE_CHECK,
  MASK_CHECK,
  PAYLOAD_LENGTH_CHECK,
  MASKING_KEY_LENGTH,
} = require('./constants');

class Frame {
  constructor(buf) { // a buffer or an object
    this.buffer = buf instanceof Buffer ? buf : this._initBuf(buf);
    this.fin = this.buffer[0] & FIN_CHECK;
    this.opcode = this.buffer[0] & OPCODE_CHECK;
    this.mask = this.buffer[1] & MASK_CHECK;
    this.payloadLength = this.buffer[1] & PAYLOAD_LENGTH_CHECK;
  }

  _initBuf({ payload, fin = FIN_CHECK, opcode = 1, mask = 0 }) {
    const metaBuf = Buffer.allocUnsafe(2);
    let payloadBuf = payload instanceof Buffer ? payload : Buffer.from(payload);

    metaBuf[0] = fin | opcode; //ignore exts for now
    metaBuf[1] = mask | Buffer.byteLength(payload);

    return Buffer.concat([metaBuf, payloadBuf]);
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

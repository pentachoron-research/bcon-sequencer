const cbor = require("cbor");
const { base58 } = require("bstring");
class Bundle {
  constructor(parentBundle, txids) {
    this.parentBundle = parentBundle || "";
    this.txids = txids || [];
  }

  encode() {
    return base58.encode(cbor
      .encode({
        parentBundle: this.parentBundle,
        txids: this.txids,
      }))
      ;
  }

  static decode(base58encoded) {
    const buffer = base58.decode(base58encoded);
    const decodedObject = cbor.decodeFirstSync(buffer);
    return {
      parentBundle: decodedObject.parentBundle,
      txids: decodedObject.txids,
    };
  }
}

module.exports = { Bundle };

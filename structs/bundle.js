const cbor = require("cbor");

class Bundle {
  constructor(parentBundle, txids) {
    this.parentBundle = parentBundle || "";
    this.txids = txids || [];
  }

  encode() {
    return cbor.encode({
      parentBundle: this.parentBundle,
      txids: this.txids,
    });
  }

  static decode(buffer) {
    const decodedObject = cbor.decodeFirstSync(buffer);
    return {
      parentBundle: decodedObject.parentBundle,
      txids: decodedObject.txids,
    };
  }
}

module.exports = { Bundle };

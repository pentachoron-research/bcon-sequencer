const cbor = require("cbor");
const crypto = require("crypto");
const { base58 } = require("bstring");
class BconTx {
  constructor({ address, signature, contractId, input, maxGas, fee, nonce }) {
    this.address = address || "";
    this.signature = signature || "";
    this.nonce = nonce || crypto.randomBytes(4).readUInt32BE(0);
    this.maxGas = maxGas || "0";
    this.fee = fee || "0";
    this.contractId = contractId || "0".repeat(32);
    this.input = input || "";
  }

  encode() {

    return base58.encode(cbor
      .encode({
        address: this.address,
        signature: this.signature,
        nonce: this.nonce,
        maxGas: this.maxGas,
        fee: this.fee,
        contractId: this.contractId,
        input: cbor.encode(this.input),
      }))
      
  }

  static decode(base58encoded) {
 
    const buffer = base58.decode(base58encoded);
    const decodedObject = cbor.decodeFirstSync(buffer);
    return {
      address: decodedObject.address,
      signature: decodedObject.signature,
      contractId: decodedObject.contractId,
      input: cbor.decode(decodedObject.input),
      maxGas: decodedObject.maxGas,
      fee: decodedObject.fee,
      nonce: decodedObject.nonce,
    };
  }
}

module.exports = { BconTx };

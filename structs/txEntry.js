const cbor = require("cbor");
const crypto = require("crypto");
const { base58 } = require("bstring");
class BconTx {
  constructor({
    address,
    signature,
    contractId,
    input,
    maxGas,
    fee,
    nonce,
    precursor,
    position,
    parentBundleHash,
    sequencerSignature,
  }) {
    this.address = address || "";
    this.signature = signature || "";
    this.nonce = nonce || crypto.randomBytes(4).readUInt32BE(0);
    this.maxGas = maxGas || "0";
    this.fee = fee || "0";
    this.contractId = contractId || "0".repeat(32);
    this.input = input || "";
    this.precursor = precursor || [];
    this.position = position || null;
    this.parentBundleHash = parentBundleHash || null;
    this.sequencerSignature = sequencerSignature || null;
  }

  encode() {
    return base58.encode(
      cbor.encode({
        address: this.address,
        signature: this.signature,
        nonce: this.nonce,
        maxGas: this.maxGas,
        fee: this.fee,
        contractId: this.contractId,
        input: cbor.encode(this.input),
        precursor: this.precursor,
        position: this.position,
        parentBundleHash: this.parentBundleHash,
        sequencerSignature: this.sequencerSignature,
      })
    );
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
      precursor: decodedObject.precursor,
      position: decodedObject.position,
      parentBundleHash: decodedObject.parentBundleHash,
      sequencerSignature: decodedObject.sequencerSignature,
    };
  }
}

module.exports = { BconTx };

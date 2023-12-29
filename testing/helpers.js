const ECPairFactory = require("ecpair");
const bitcoinjsLib = require("bitcoinjs-lib");
const ecc = require("tiny-secp256k1");

bitcoinjsLib.initEccLib(ecc);

const ECPair = ECPairFactory.default(ecc);

function toXOnly(pubkey) {
  return pubkey.subarray(1, 33);
}

module.exports = {
  ECPair,
  toXOnly,
};

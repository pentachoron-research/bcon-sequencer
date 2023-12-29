const { ECPair, toXOnly } = require("./helpers");
const tinysecp = require("tiny-secp256k1");
const { crypto, payments, networks } = require("bitcoinjs-lib");

function getP2TRAddress(PrivateKey) {
  const network = networks.testnet;
  const keyPair = ECPair.fromWIF(PrivateKey, network);

  console.log(keyPair.publicKey);

  const tweakedSigner = tweakSigner(keyPair, { network });

  const p2pktr = payments.p2tr({
    pubkey: toXOnly(tweakedSigner.publicKey),
    network,
  });
  const p2pktr_addr = p2pktr.address ?? "";

  return p2pktr;
}

function tweakSigner(signer, opts = {}) {
  let privateKey = signer.privateKey;
  if (!privateKey) {
    throw new Error("Private key is required for tweaking signer!");
  }
  if (signer.publicKey[0] === 3) {
    privateKey = tinysecp.privateNegate(privateKey);
  }

  const tweakedPrivateKey = tinysecp.privateAdd(
    privateKey,
    tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash)
  );
  if (!tweakedPrivateKey) {
    throw new Error("Invalid tweaked private key!");
  }

  return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
    network: opts.network,
  });
}

function tapTweakHash(pubKey, h) {
  return crypto.taggedHash(
    "TapTweak",
    Buffer.concat(h ? [pubKey, h] : [pubKey])
  );
}

module.exports = {
  getP2TRAddress,
  tweakSigner,
};

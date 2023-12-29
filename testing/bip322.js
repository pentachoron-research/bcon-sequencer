const { BIP322, Signer, Verifier, Address } = require("bip322-js");
const bitcoin = require("bitcoinjs-lib");

const scriptPubKey = Address.convertAdressToScriptPubkey(
  "tb1puj6vr877ehdm9aymljanh0v7ywsr4j9ggz92fxzfc0h8gxgy3kgscvk8us"
);
const message = "Hello World";

const toSpend = BIP322.buildToSpendTx(message, scriptPubKey); // bitcoin.Transaction
const toSpendTxId = toSpend.getId();

const toSign = BIP322.buildToSignTx(toSpendTxId, scriptPubKey);

let hex = toSign.toHex();

// verify
const signature = BIP322.encodeWitness(
  bitcoin.Psbt.fromHex(
    "70736274ff01003d00000000013342e6e52c4bb67fadca0cfc6d24357e87b003b76ccc2348795c0b9e273d1060000000000000000000010000000000000000016a000000000001012b0000000000000000225120e4b4c19fdecddbb2f49bfcbb3bbd9e23a03ac8a8408aa49849c3ee7419048d910108420140a747a30734cdc6931575e0b41604fee934e1a7bd991e1c3bb0a0846d4db906dbb694edf3814bfe88f794a63fdc581487fc87e268aa8a112cb5398134fe728f600000"
  )
);
console.log(signature);
const validity = Verifier.verifySignature(
  "tb1puj6vr877ehdm9aymljanh0v7ywsr4j9ggz92fxzfc0h8gxgy3kgscvk8us",
  message,
  signature
);
console.log(validity);

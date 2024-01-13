const { BconTx } = require("../structs/txEntry");
const { Bundle } = require("../structs/bundle");
const { BIP322, Signer, Verifier, Address } = require("bip322-js");
const blake2s = require("bcrypto/lib/blake2s");
const { base58 } = require("bstring");
const bio = require("bufio");
const axios = require("axios");
const crypto = require("crypto");
const bitcoin = require("bitcoinjs-lib");

let sendTx = async () => {
  try {
    const privateKey = "";
    const address =
      "tb1p0wt007yyzfswhsnwnc45ly9ktyefzyrwznwja0m4gr7n9vjactes80klh4";

    const message = "const yo = 'test'";
    const network = bitcoin.networks.testnet;

    const input = {
      data: "const yo = 'test'",
    };

    const signature = Signer.sign(
      privateKey,
      address,
      JSON.stringify(input),
      network
    );

    const newTx = new BconTx({
      address: "tb1p0wt007yyzfswhsnwnc45ly9ktyefzyrwznwja0m4gr7n9vjactes80klh4",
      nonce: crypto.randomInt(1000000000),
      signature,
      input,
    });

    const encodedTx = newTx.encode();

    console.log(newTx);

    const response = await axios.post("http://127.0.0.1:2880/tx", encodedTx, {
      headers: { "Content-Type": "text/plain" },
    });

    let txHash = base58.encode(blake2s.digest(base58.decode(encodedTx), 32));

    console.log("Response from sequencer:", response.data);
    console.log("Transaction hash:", txHash);
  } catch (error) {
    console.error("Error broadcasting transaction:", error);
  }
};

let getContent = async () => {
  const response = await axios.get(
    "http://127.0.0.1:2880/content/G7VYgxnATSsJ2UAhxxENFu6DSy4WV9YtpsbQf3mnyNPB"
  );

  let data = response.data;

  console.log(data);

  console.log(BconTx.decode(data));
};

(async () => {
  await sendTx();
})();

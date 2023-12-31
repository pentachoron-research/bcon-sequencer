const { BconTx } = require("../structs/txEntry");
const { BIP322, Signer, Verifier, Address } = require("bip322-js");
const bio = require("bufio");
const axios = require("axios");
const bitcoin = require("bitcoinjs-lib");

(async () => {
  try {
    const privateKey = "t";
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
      nonce: 1,
      signature,
      input,
    });

    const encodedTx = newTx.encode();

    console.log(newTx);

    const response = await axios.post("http://127.0.0.1:2880/tx", encodedTx, {
      headers: { "Content-Type": "text/plain" },
    });

    console.log("Transaction ID:", response.data);
  } catch (error) {
    console.error("Error broadcasting transaction:", error);
  }
})();

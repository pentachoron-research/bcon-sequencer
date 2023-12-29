const { ECPair, toXOnly } = require("./helpers");
const { getP2TRAddress, tweakSigner } = require("./test");
const bitcoin = require("bitcoinjs-lib");
const { Psbt, networks, script } = bitcoin;
const axios = require("axios");
(async () => {
  const network = bitcoin.networks.testnet; // Ensure you define the network
  const privateKeyWIF = "cPMB77TJ2CgHdv3dfyba5AhUjCeSBrpyGdJcnJZzsAMj85db9HoB";
  const keyPair = ECPair.fromWIF(privateKeyWIF, network);

  const p2trAddress = getP2TRAddress(privateKeyWIF);

  const psbt = new Psbt({ network });
  console.log(p2trAddress);
  console.log(p2trAddress.output);

  psbt.addInput({
    hash: "0000000000000000000000000000000000000000000000000000000000000000",
    index: 0,
    witnessUtxo: {
      script: p2trAddress.output, // Use the output script of P2WPKH
      value: 99500,
    },
    tapInternalKey: toXOnly(keyPair.publicKey),
  });

  // Add the OP_RETURN output
  const data = Buffer.from(
    "This string should contain about 84 bytes and should fail on the bitcoin network!!!!"
  );
  const nullDataScript = bitcoin.payments.embed({ data: [data] }).output;

  psbt.addOutput({
    address: p2trAddress.address,
    value: 99500 - 20,
  });

  psbt.addOutput({
    script: nullDataScript,
    value: 0,
  });

  let tweakedSigner = tweakSigner(keyPair);

  psbt.signInput(0, tweakedSigner);
  psbt.finalizeAllInputs();

  const tx = psbt.extractTransaction();
  console.log(`Broadcasting Transaction Hex: ${tx.toHex()}`);

  try {
    const response = await axios.post("http://127.0.0.1:2880/tx", tx.toHex(), {
      headers: { "Content-Type": "text/plain" },
    });

    console.log("Transaction ID:", response.data);
  } catch (error) {
    console.error("Error broadcasting transaction:", error);
  }
})();

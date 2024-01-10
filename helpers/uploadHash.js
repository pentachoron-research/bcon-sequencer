// TODO: Fix network and make it depend on config. Need to set network in bcoin inside function somehow
const bcoin = require("../bcoin").set("testnet");
const FEE = 250;
const NETWORK_TYPE = "testnet";
const { base58 } = require("bstring");

async function uploadHash(hash) {
  const mtx = new bcoin.MTX();
  const network = bcoin.Network.get(NETWORK_TYPE);
  const keyring = bcoin.KeyRing.fromSecret(global.config.privateKey, network);
  let utxos = await waitUntilUTXO(keyring.getAddress("string"));

  utxos.forEach((utxo) => {
    const coin = bcoin.Coin.fromJSON({
      version: 1,
      height: -1,
      value: utxo.value,
      script: bcoin.Script.fromPubkeyhash(keyring.getKeyHash())
        .toRaw()
        .toString("hex"),
      coinbase: false,
      hash: utxo.txid,
      index: utxo.vout,
    });
    mtx.addCoin(coin);
  });

  const totalValue = utxos.reduce((acc, utxo) => acc + utxo.value, 0);
  const changeValue = totalValue - FEE;

  mtx.addOutput(keyring.getAddress("string"), changeValue);
  console.log("Hash that we try to upload:", hash);
  console.log("Bytelength of hash:", hash.length);
  mtx.addOutput(bcoin.Output.fromScript(bcoin.Script.fromNulldata(hash), 0));

  mtx.sign(keyring);

  const tx = mtx.toTX();

  try {
    console.log("Uploading bundle...");
    await global.node.broadcast(tx);
    console.log(
      "Uploaded bundle!\nBtc txid:",
      tx.txid("hex"),
      "\nBundle hash: ",
      base58.encode(hash)
    );
    return tx.txid("hex");
  } catch (e) {
    console.error("ERROR!!", e);
    throw e;
  }
}

async function waitUntilUTXO(address) {
  return new Promise((resolve, reject) => {
    let intervalId;
    const checkForUtxo = async () => {
      try {
        const response = await fetch(
          `https://mempool.space/${NETWORK_TYPE}/api/address/${address}/utxo`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.length > 0) {
          resolve(data);
          clearInterval(intervalId);
        }
      } catch (error) {
        reject(error);
        clearInterval(intervalId);
      }
    };
    checkForUtxo();
    intervalId = setInterval(checkForUtxo, 10000);
  });
}

module.exports = { uploadHash };

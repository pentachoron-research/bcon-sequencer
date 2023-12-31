const bcoin = require("../bcoin").set("testnet");

async function uploadHash(hash) {
  const mtx = new bcoin.MTX();
  const network = bcoin.Network.get("testnet");
  const keyring = bcoin.KeyRing.fromSecret(global.config.privateKey, network);
  let utxos = await waitUntilUTXO(keyring.getAddress("string"));

  const pubKeyHash = keyring.getKeyHash();
  const script = bcoin.Script.fromPubkeyhash(pubKeyHash);
  const scriptHex = script.toRaw().toString("hex");
  utxos.forEach((utxo) => {
    const coin = bcoin.Coin.fromJSON({
      version: 1,
      height: -1,
      value: utxo.value,
      script: scriptHex,
      coinbase: false,
      hash: utxo.txid,
      index: utxo.vout,
    });
    mtx.addCoin(coin);
  });

  const outputAddress = keyring.getAddress("string");
  const fee = 250;
  const totalValue = utxos.reduce((acc, utxo) => acc + utxo.value, 0);
  const changeValue = totalValue - fee;

  const memoData = Buffer.from(hash, "utf8");
  const memoScript = bcoin.Script.fromNulldata(memoData);

  mtx.addOutput(outputAddress, changeValue);
  mtx.addOutput(memoScript, 0);

  mtx.sign(keyring);

  const tx = mtx.toTX();

  // Send the transaction
  try {
    const result = await global.node.broadcast(tx);
    return tx.hash("hex");
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function waitUntilUTXO(address) {
  return new Promise((resolve, reject) => {
    let intervalId;
    const checkForUtxo = async () => {
      try {
        let response;
        if (global.config.network === "testnet") {
          response = await fetch(
            `https://mempool.space/testnet/api/address/${address}/utxo`
          );
        } else {
          response = await fetch(
            `https://mempool.space/api/address/${address}/utxo`
          );
        }

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

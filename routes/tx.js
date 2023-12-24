const bcoin = require("../bcoin");

module.exports = (server) => {
  server.post("/tx", async (req, res) => {
    try {
      const rawTx = req.body.rawTx;
      const tx = bcoin.TX.fromRaw(rawTx, "hex");

      if (!utxoChecker(tx)) {
        res.send(400, "UTXo must be invalid starting with 1000000");
      } else {
        const isValid = tx.verify();

        if (isValid) {
          const txHash = tx.hash();
          if (await global.databases.transactions.get(txHash)) {
            res.send(400, "TX has already been uploaded");
          } else {
            await global.databases.transactions.put(txHash, tx);
            await global.mempool.push(txHash);
            res.send(200, "Transaction successfully posted");
          }
        } else {
          res.send(400, "Invalid transaction");
        }
      }
    } catch (err) {
      res.send(500, `Error processing transaction: ${err.message}`);
    }
  });
};

function utxoChecker(tx) {
  return tx.inputs.some((input) => {
    const prevTxHash = input.prevout.hash.toString("hex");

    return prevTxHash.startsWith("1000000");
  });
}

const bcoin = require("../bcoin");
const blake2s = require("bcrypto/lib/blake2s");
const { base58 } = require("bstring");
const cbor = require("cbor");
const { BconTx } = require("../structs/txEntry");
const { BIP322, Signer, Verifier, Address } = require("bip322-js");

module.exports = (server) => {
  server.post("/tx", async (req, res) => {
    try {
      const tx = req.body;
      const buffer=base58.decode(tx)
      try {
        let decodedTx = BconTx.decode(tx);

        const validTx = Verifier.verifySignature(
          decodedTx.address,
          JSON.stringify(decodedTx.input),
          decodedTx.signature
        );

        if (validTx) {
          let txHash = base58.encode(blake2s.digest(Buffer.from(buffer),32));

          console.log(txHash);

          if (await global.databases.transactions.get(Buffer.from(txHash))) {
            res.send(400, "TX has already been uploaded");
          } else {
            await global.databases.transactions.put(
              Buffer.from(txHash),
              Buffer.from(tx)
            );
            await global.databases.mempool.put(
              Buffer.from(txHash),
              Buffer.from(tx)
            );
            await global.databases.allContent.put(
              Buffer.from(txHash),
              Buffer.from(tx)
            );
            res.send(200, "Transaction successfully posted");
          }
        } else {
          return res.send(500, `Invalid TX`);
        }
      } catch (err) {
        console.log(err);
        res.send(500, `Error processing transaction: ${err.message}`);
      }
    } catch (err) {
      console.log(err);
      res.send(500, `Error processing transaction: ${err.message}`);
    }
  });
};

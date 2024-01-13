const blake2s = require("bcrypto/lib/blake2s");
const ed25519 = require("bcrypto/lib/ed25519");
const { base58 } = require("bstring");
const { BconTx } = require("../structs/txEntry");
const { BIP322, Signer, Verifier, Address } = require("bip322-js");

/* Helpers */
const { signData } = require("../helpers/signData");
const { getMempool } = require("../helpers/getMempool");

module.exports = (server) => {
  server.post("/tx", async (req, res) => {
    try {
      let tx = req.body;
      let buffer = base58.decode(tx);
      try {
        let decodedTx = BconTx.decode(tx);

        const validTx = Verifier.verifySignature(
          decodedTx.address,
          JSON.stringify(decodedTx.input),
          decodedTx.signature
        );

        if (!validTx) {
          return res.send(500, `Invalid TX`);
        }

        // add sequencer sig, parentBundlehash, and position
        decodedTx.position = (await getMempool()).length + 1;
        decodedTx.parentBundleHash = global.recentBundle;
        decodedTx.sequencerSignature = base58.encode(
          signData(Buffer.from(new BconTx(decodedTx).encode()))
        );

        tx = new BconTx(decodedTx).encode();

        buffer = base58.decode(tx);

        let txHash = base58.encode(blake2s.digest(Buffer.from(buffer), 32));

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
          res.send(
            200,
            JSON.stringify({
              position: decodedTx.position,
              parentBundleHash: decodedTx.parentBundleHash,
              sequencerSignature: decodedTx.sequencerSignature,
            })
          );

          global.WsClients.forEach(function (client) {
            console.log("Sent Data to socket");
            client.send(tx);
          });
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

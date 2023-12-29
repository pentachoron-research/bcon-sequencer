const bcoin = require("../bcoin");
const blake2s = require("bcrypto/lib/blake2s");
const cbor = require("cbor");
const { BconTx } = require("../structs/txEntry");
const { BIP322, Signer, Verifier, Address } = require("bip322-js");

module.exports = (server) => {
  server.post("/tx", async (req, res) => {
    try {
      const tx = req.body;
      const buffer = Buffer.from(tx, "hex");

      try {
        let decodedTx = BconTx.decode(buffer);

        const validTx = Verifier.verifySignature(
          decodedTx.address,
          JSON.stringify(decodedTx.input),
          decodedTx.signature
        );

        if (validTx) {
          let txHash = blake2s
            .digest(Buffer.from(buffer), 32)
            .toString("base64");

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

// const view = new bcoin.CoinView();
// view.addEntry(
//   new bcoin.Outpoint(
//     Buffer.from(
//       "0000000000000000000000000000000000000000000000000000000000000000",
//       "hex"
//     ),
//     0
//   ),
//   new bcoin.CoinEntry().fromOutput(
//     new bcoin.Output().fromScript(
//       new bcoin.Script().fromAddress(
//         "tb1p0wt007yyzfswhsnwnc45ly9ktyefzyrwznwja0m4gr7n9vjactes80klh4"
//       ),
//       1
//     )
//   )
// );

// if (!utxoChecker(tx)) {
//   res.send(
//     400,
//     "UTXo must be invalid starting with 0000000000000000000000000000000000000000000000000000000000000000"
//   );
// } else {
//   // Error is here
//   console.log(tx.check(view));
//   const isValid = tx.verify(view);

//   console.log(isValid);

//   if (isValid) {
//     const txHash = tx.hash();
//     if (await global.databases.transactions.get(txHash)) {
//       res.send(400, "TX has already been uploaded");
//     } else {
//       await global.databases.transactions.put(
//         Buffer.from(txHash),
//         Buffer.from(tx)
//       );
//       await global.databases.mempool.put(
//         Buffer.from(txHash),
//         Buffer.from(tx)
//       );
//       res.send(200, "Transaction successfully posted");
//     }
//   } else {
//     res.send(400, "Invalid transaction");
//   }
// }

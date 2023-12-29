const blake2s = require("bcrypto/lib/blake2s");
const bio = require("bufio");

const { Bundle } = require("./structs/bundle");

module.exports = async function startSyncLoop() {
  async function uploadBundle() {
    let bundleCount = await amountOfBundles();
    let bundle = await createBundle();
    let txs = bundle.txids;

    if (txs.length <= 0) {
      return;
    }

    const encodedBundle = bundle.encode();

    let hash = blake2s
      .digest(Buffer.from(encodedBundle), 32)
      .toString("base64");

    await global.databases.bundles.put(
      Buffer.from(hash),
      Buffer.from(encodedBundle)
    );

    await global.databases.bundleNumbers.put(
      Buffer.from((bundleCount + 1).toString()),
      Buffer.from(hash)
    );
  }

  setInterval(uploadBundle, 10000);
};

async function createBundle() {
  let txs = await getMempool();

  const bundle = new Bundle("parentBundleId", txs);

  return bundle;
}

async function getMempool() {
  const mempool = [];

  const asyncIter = global.databases.mempool.iterator({
    gte: null,
    lte: null,
    values: true,
  });

  for await (const { key, value } of asyncIter) {
    mempool.push(key.toString());
  }

  return mempool;
}

async function amountOfBundles() {
  let count = 0;
  const asyncIter = global.databases.bundles.iterator({
    gte: null,
    lte: null,
    values: true,
  });
  for await (const { key, value } of asyncIter) {
    count++;
  }
  return count;
}

const blake2s = require("bcrypto/lib/blake2s");
const { Bundle } = require("../structs/bundle");

module.exports = async (chainEntry, block) => {
  console.log(global.blockCounter);
  const now = Date.now();
  if (now - global.lastBlockTime > global.blockResetThreshold) {
    global.blockCounter++;

    if (global.blockCounter === 5) {
      console.log("test");
      await uploadBundle();
      blockCounter = 0;
    }
  }
  global.lastBlockTime = now;

  global.block = chainEntry.height;
  console.log("Added block ", global.block);
};

async function uploadBundle() {
  try {
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

    await deleteMempool();

    await global.databases.pendingBundles.put(
      Buffer.from(hash),
      Buffer.from(encodedBundle)
    );

    await global.databases.bundleNumbers.put(
      Buffer.from((bundleCount + 1).toString()),
      Buffer.from(hash)
    );
  } catch (e) {
    console.log(e);
  }

  console.log("Bundle Uploaded");
}

async function createBundle() {
  let txs = await getMempool();

  console.log(txs);

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

async function deleteMempool() {
  const asyncIter = global.databases.mempool.iterator({
    gte: null,
    lte: null,
    values: true,
  });

  for await (const { key, value } of asyncIter) {
    global.databases.mempool.remove(key);
  }
}

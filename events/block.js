const blake2s = require("bcrypto/lib/blake2s");
const { Bundle } = require("../structs/bundle");
const { uploadHash } = require("../helpers/uploadHash.js");

module.exports = async (chainEntry, block) => {
  for (const tx of block.txs) {
    // Runs when a bundle has been confirmed on chain
    let bundleHash = tx.hash().toString("hex");
    let encodedBundle = await global.databases.pendingBundles.get(
      Buffer.from(bundleHash)
    );

    if (encodedBundle) {
      console.log(encodedBundle);
      console.log(encodedBundle.toString());

      console.log(Bundle.decode(encodedBundle));
      let bundleHash = blake2s.digest(encodedBundle, 32).toString("base64");
      console.log(bundleHash);

      await global.databases.bundles.put(
        Buffer.from(bundleHash),
        Buffer.from(encodedBundle)
      );

      await global.databases.pendingBundles.del(Buffer.from(bundleHash));
    }
  }
  const now = Date.now();
  if (now - global.lastBlockTime > global.blockResetThreshold) {
    global.blockCounter++;
    console.log(global.blockCounter);
    if (global.blockCounter === 1) {
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
    let bundle = await createBundle(bundleCount);
    let txs = bundle.txids;

    if (txs.length <= 0) {
      return;
    }

    const encodedBundle = bundle.encode();

    let hash = blake2s
      .digest(Buffer.from(encodedBundle), 32)
      .toString("base64");

    await deleteMempool();

    let uploadedBundleHash = await uploadHash(hash);

    await global.databases.pendingBundles.put(
      Buffer.from(uploadedBundleHash),
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

async function createBundle(amount) {
  let txs = await getMempool();

  const parentBundleId = amount
    ? await global.databases.bundleNumbers.get(Buffer.from(amount.toString()))
    : "first";

  console.log(parentBundleId.toString());

  const bundle = new Bundle(parentBundleId.toString(), txs);

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

  console.log(mempool);
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
    global.databases.mempool.del(key);
  }
}

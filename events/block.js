const blake2s = require("bcrypto/lib/blake2s");
const { Bundle } = require("../structs/bundle");
const { uploadHash } = require("../helpers/uploadHash.js");
const { base58 } = require("bstring");

module.exports = async (chainEntry, block) => {
  global.block = chainEntry.height;
  console.log("Added block ", global.block);

  await processTransactions(block);
  await manageBlockCounter();
};

// Checks if any bundles are included on a block
async function processTransactions(block) {
  for (const transaction of block.txs) {
    await processTransaction(transaction);
  }
}

async function manageBlockCounter() {
  const now = Date.now();
  const pendings = await global.databases.pendingBundles.values()
  if (pendings.length > 0) {
    console.log("Pending bundles:", pendings.length);
    return "Previous bundle still pending"
  }
  if (now - global.lastBlockTime > global.blockResetThreshold) {
    global.blockCounter++;
    console.log(global.blockCounter);
    // console.log(global.node)
    if (global.blockCounter >= 1) {
      await uploadBundle();
      global.blockCounter = 0;
    }
  }
  global.lastBlockTime = now;
}

// Moves bundle from pending to confirmed/finished
async function processTransaction(transaction) {
  const transactionHash = transaction.txid("hex");
 
  const encodedBundle = await global.databases.pendingBundles.get(
    Buffer.from(transactionHash)
  );

  if (encodedBundle) {
    console.log("Encoded, confirmed bundle:",encodedBundle.toString());
    const bundleHash = base58.encode(blake2s.digest(base58.decode(encodedBundle.toString()), 32));
    console.log("Confirmed bundle, decoded:", Bundle.decode(encodedBundle.toString()));
   
    console.log("Confirmed bundle", bundleHash);
    await global.databases.bundles.put(Buffer.from(bundleHash), encodedBundle);
    await global.databases.pendingBundles.del(Buffer.from(transactionHash));
  }
}

async function uploadBundle() {
  try {
    const bundleCount = await amountOfBundles();
    console.log("Bundle count",bundleCount);
    const bundle = await createBundle(bundleCount);
    const transactions = bundle.txids;

    if (transactions.length <= 0) {
      console.log("Empty bundle, uploading anyway");
    }

    const encodedBundle = bundle.encode();
    console.log("Encoded bundle:",encodedBundle);
    const hash = blake2s.digest(Buffer.from(encodedBundle), 32);
    let hash58 = base58.encode(hash);


    console.log("Uploaded bundle hash:",hash58);

    await deleteMempool();

    const uploadedBundleHash = await uploadHash(hash);

    await global.databases.pendingBundles.put(
      Buffer.from(uploadedBundleHash),
      Buffer.from(encodedBundle)
    );

    await global.databases.allContent.put(
      Buffer.from(hash58),
      Buffer.from(encodedBundle)
    );

    await global.databases.bundleNumbers.put(
      Buffer.from((bundleCount + 1).toString()),
      Buffer.from(hash58)
    );
  } catch (error) {
    console.error("Error uploading bundle: ", error);
  }
}

async function createBundle(amount) {
  let txs = await getMempool();
  console.log("Current amount of bundles:", amount);
  const parentBundleId = amount
    ? await global.databases.bundleNumbers.get(Buffer.from(amount.toString()))
    : "first";


  console.log(
    "Current highest bundle (parent bundle for next one):",
    parentBundleId.toString()
  );

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

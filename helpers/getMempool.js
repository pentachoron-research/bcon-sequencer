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

module.exports = { getMempool };

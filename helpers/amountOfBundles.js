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

module.exports = { amountOfBundles };

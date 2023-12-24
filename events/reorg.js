module.exports = async (disconnectedChainEntry) => {
  await global.databases.transactions.close();
  await global.databases.bundles.close();
};

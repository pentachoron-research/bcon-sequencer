const { amountOfBundles } = require("./helpers/amountOfBundles.js");

module.exports = async function initLoad() {
  let amount = await amountOfBundles();
  global.recentBundle = amount
    ? (
        await global.databases.bundleNumbers.get(Buffer.from(amount.toString()))
      ).toString()
    : "first";
  console.log("Current BundleID: " + global.recentBundle);
};

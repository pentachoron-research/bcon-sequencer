module.exports = (chainEntry, block) => {
  global.block = chainEntry.height;
  console.log("Connected block ", global.block);
};

module.exports = async function startSyncLoop() {
  async function syncNetworkInfo() {
    try {
      global.block = 0;
    } catch (e) {
      console.log(e);
    }
  }
};

const { BconTx } = require("../structs/txEntry");

const isBase58 = (value) => /^[A-HJ-NP-Za-km-z1-9]*$/.test(value);

module.exports = (server) => {
  server.get("/content/:hash", async (req, res) => {
    try {
      const hash = req.params.hash;

      if (!isBase58(hash)) {
        return res.send(400, "Hash must be base58");
      }

      const bufferHash = Buffer.from(hash);
      const data = await global.databases.allContent.get(bufferHash);

      if (data) {
        console.log(data)
        return res.send(200, data.toString("utf8"));
      } else {
        console.warn("Hash does not exist");
        return res.send(404, "Hash does not exist");
      }
    } catch (error) {
      console.error("Error retrieving content:", error);
      res.send(500, "Internal Server Error");
    }
  });
};

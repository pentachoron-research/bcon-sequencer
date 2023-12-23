// const lmdb = require("lmdb");
const JSON5 = require("json5");
const autoLoad = require("@fastify/autoload");
const fastifyCors = require("@fastify/cors");
const app = require("fastify")({ logger: false });
const fs = require("fs");
const bitcoin = require("bitcoinjs-lib");

(async () => {
  global.config = JSON5.parse(fs.readFileSync("./config.json5", "utf8"));
  global.bitcoin = bitcoin;
  //   global.databases = {
  //     transactions: lmdb.open("./db/transactions"),
  //   };

  let startSyncLoop = require("./syncer.js");

  await startSyncLoop();
})();

const start = async () => {
  app.addHook("preHandler", (req, res, done) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "*");
    const isPreflight = /options/i.test(req.method);
    if (isPreflight) {
      return res.send();
    }
    done();
  });
  app.register(fastifyCors, {
    origin: "*",
    methods: ["GET"],
  });
  app.addContentTypeParser(
    "application/octet-stream",
    function (request, payload, done) {
      let data = Buffer.alloc(0);
      payload.on("data", (chunk) => {
        if (chunk.length + data.length >= 1e8) {
          throw "Too big payload";
        }
        data = Buffer.concat([data, chunk]);
      });
      payload.on("end", () => {
        done(null, data);
      });
    }
  );
  app.register(autoLoad, {
    dir: require("path").join(__dirname, "routes"),
  });
  try {
    await app.listen({ port: global.config.port });
  } catch (err) {
    console.log(err);
    app.log.error(err);
    process.exit(1);
  }
};
start();

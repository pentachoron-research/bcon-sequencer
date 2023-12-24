const bcoin = require("./bcoin");
const bweb = require("bweb");
const bdb = require("bdb");
const fs = require("fs");
const path = require("path");

(async () => {
  const dbDir = path.resolve(__dirname, "./db");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  global.config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
  global.node = new bcoin.FullNode({
    prefix: "~/.bcon-sequencer-chain",
    file: true,
    "max-files": 256,
    argv: true,
    env: true,
    logFile: true,
    // logConsole: true,
    // logLevel: "info",
    "max-outbound": 12,
    memory: false,
    network: global.config.network,
    prune: true,
    workers: true,
    listen: true,
    loader: require,
  });
  global.block = 0;
  global.databases = {
    transactions: bdb.create(path.join(dbDir, "transactions.db")),
    bundles: bdb.create(path.join(dbDir, "bundles.db")),
  };
  global.mempool = [];

  await global.databases.transactions.open();
  await global.databases.bundles.open();

  await node.open();
  await node.connect();
  node.startSync();

  node.chain.on("connect", require("./events/block"));
  node.chain.on("disconnect", require("./events/reorg"));
})();

const start = async () => {
  const server = bweb.server({
    port: global.config.port,
    sockets: true,
  });

  server.use(async (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
      return res.send(200);
    }
    await next();
  });

  server.use(server.bodyParser());
  server.use(server.router());

  server.use(async (req, res, next) => {
    if (req.headers["content-type"] === "application/octet-stream") {
      let data = Buffer.alloc(0);
      req.on("data", (chunk) => {
        if (chunk.length + data.length >= 1e8) {
          throw new Error("Too big payload");
        }
        data = Buffer.concat([data, chunk]);
      });
      req.on("end", () => {
        req.body = data;
        next();
      });
    } else {
      await next();
    }
  });

  fs.readdirSync(path.join(__dirname, "routes")).forEach((file) => {
    const route = require(path.join(path.join(__dirname, "routes"), file));
    route(server);
  });

  try {
    await server.open();
  } catch (err) {
    console.log(err);
    app.log.error(err);
    process.exit(1);
  }
};
start();

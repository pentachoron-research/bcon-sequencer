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
  bcoin.set("testnet");
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

  global.databases = {
    allContent: bdb.create(path.join(dbDir, "allContent.db")),
    transactions: bdb.create(path.join(dbDir, "transactions.db")),
    bundles: bdb.create(path.join(dbDir, "bundles.db")),
    bundleNumbers: bdb.create(path.join(dbDir, "bundleNums.db")),
    pendingBundles: bdb.create(path.join(dbDir, "pendingBundles.db")),
    mempool: bdb.create(path.join(dbDir, "mempool.db")),
  };
  global.block = 0;

  /*
    Bundles are made every 5 blocks however when the node is syncing it will spam blocks
    (AFAIK bcoin doesnt have a fully synced event that i could get working)

    so this is kinda a hacky way to not make bundles when syncing
  */
  global.lastBlockTime = Date.now();
  global.blockCounter = 0;
  global.blockResetThreshold = 45000;

  await global.databases.allContent.open();
  await global.databases.transactions.open();
  await global.databases.bundles.open();
  await global.databases.bundleNumbers.open();
  await global.databases.pendingBundles.open();
  await global.databases.mempool.open();

  await node.open();
  await node.connect();
  node.startSync();

  // Handles bundle making
  node.chain.on("connect", require("./events/block"));
  node.chain.on("disconnect", require("./events/reorg"));
})();

const start = async () => {
  const server = bweb.server({
    host:"0.0.0.0",
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

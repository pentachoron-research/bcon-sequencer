// fetch("http://127.0.0.1:2880/")
//   .then((response) => response.text())
//   .then((data) => console.log(data))
//   .catch((error) => console.error("Error:", error));

(async () => {
  const bdb = require("bdb");
  const db = bdb.create("db/transactions.db");
  await db.open();

  await db.put("txHash", "tx");
})();

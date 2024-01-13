const WebSocket = require("faye-websocket");
const { BconTx } = require("../structs/txEntry");
const client = new WebSocket.Client("ws://localhost:2881/");

client.on("open", function (event) {
  console.log("WebSocket client connected");
});

client.on("message", function (event) {
  let data = event.data;

  console.log(BconTx.decode(data));
});

client.on("close", function (event) {
  console.log("Connection Closed", event.code, event.reason);
  client = null;
});

const fp = require("fastify-plugin");

module.exports = fp(async function (app, opts) {
  return "ok";
});

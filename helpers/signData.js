const bcrypto = require("bcrypto/lib/ed25519");
const crypto = require("crypto");
const secret = require("../.secret/top-secret.json");
function signData(data) {
  const dataHash = crypto.createHash("sha256").update(data).digest();
  const signature = bcrypto.sign(
    dataHash,
    Buffer.from(secret.privatekey, "hex")
  );

  return signature;
}

module.exports = { signData };

const bcrypto = require("bcrypto/lib/ed25519");
const crypto = require("crypto");
const secret = require("../.secret/top-secret.json");

const privateKey = Buffer.from(secret.privatekey, "hex");

// console.log(privateKey.toString("hex"));

const message = Buffer.from("Hello");

const messageHash = crypto.createHash("sha256").update(message).digest();

const signature = bcrypto.sign(messageHash, privateKey);

const publicKey = bcrypto.publicKeyCreate(privateKey);

const isValid = bcrypto.verify(messageHash, signature, publicKey);
console.log(publicKey.toString("hex"));
console.log("Signature is valid:", isValid);

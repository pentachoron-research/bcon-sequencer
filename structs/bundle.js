const bio = require("bufio");

class Bundle extends bio.Struct {
  constructor(parentBundle, txids) {
    super();
    this.parentBundle = parentBundle || "";
    this.txids = txids || [];
  }

  getSize() {
    let size = 0;
    size += bio.sizeVarString(this.parentBundle, "utf8");
    size += bio.sizeVarint(this.txids.length);
    for (const txid of this.txids) {
      size += bio.sizeVarString(txid, "utf8");
    }
    return size;
  }

  write(bw) {
    bw.writeVarString(this.parentBundle, "utf8");
    bw.writeVarint(this.txids.length);
    for (const txid of this.txids) {
      bw.writeVarString(txid, "utf8");
    }
    return this;
  }

  read(br) {
    this.parentBundle = br.readVarString("utf8");
    const txidCount = br.readVarint();
    this.txids = [];
    for (let i = 0; i < txidCount; i++) {
      this.txids.push(br.readVarString("utf8"));
    }
    return this;
  }
}

module.exports = { Bundle };

const https = require("https");
const fs = require("fs");

https.get("https://s1.rpmvip.com/assets/index-B82x0F06.js", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", async () => {
    const rotStart = data.indexOf("(function(s,e){const t=fe");
    const vaDef = data.indexOf("function Va(){const s=");
    const vaEnd = data.indexOf("function fe(s,e){");
    const code = data.slice(vaDef, vaEnd) + 
                 "\nfunction fe(s,e){return s=s-120,Va()[s]}\n" + 
                 data.slice(rotStart, vaDef);

    const iife = data.slice(935295);
    const pStart = iife.indexOf("P=x=>");
    const yeEnd = iife.indexOf(",Le=async");
    const block = iife.slice(pStart, yeEnd);
    console.log("Found block length:", block.length);
    console.log("Block start:", block.slice(0, 100));
    console.log("Block end:", block.slice(-100));
    fs.writeFileSync("/tmp/rpmvip_block.js", code + "\nlet " + block + ";\nmodule.exports = { Q, se, V, Z, P, G, Y, K, U, re, Se, ye };");
    console.log("Saved to /tmp/rpmvip_block.js");
  });
});

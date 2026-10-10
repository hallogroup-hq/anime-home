const https = require("https");

const options = {
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  }
};

https.get("https://s13.nontonanimeid.boats/detective-conan-episode-1215/", options, (res) => {
  let html = "";
  res.on("data", c => html += c);
  res.on("end", () => {
    console.log("Status code:", res.statusCode);
    console.log("HTML length:", html.length);
    const matches = [...html.matchAll(/https?:\/\/[^\s"'\<\>]+/g)].map(m => m[0]);
    const filtered = matches.filter(u => u.includes("kotakanime") || u.includes("rpmvip") || u.includes("streamku") || u.includes("embed") || u.includes("video"));
    console.log("Found matches:", [...new Set(filtered)]);
    
    // Also search for data-post, nonce, or download tables
    const downloadIdx = html.indexOf("download");
    if (downloadIdx !== -1) {
      console.log("Download section snippet:", html.slice(downloadIdx - 100, downloadIdx + 1000));
    }
  });
}).on("error", err => {
  console.error("HTTP error:", err);
});

const fetch = globalThis.fetch;
const fs = require("fs");

const episodes = JSON.parse(fs.readFileSync("/tmp/conan_1000_1215.json", "utf8"));

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "id,en-US;q=0.9,en;q=0.8",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "same-origin"
};

async function testRange() {
  const sample = episodes.filter(e => e.epNum >= 1000 && e.epNum <= 1010);
  console.log(`Testing ${sample.length} episodes (1000 to 1010)...`);

  for (const ep of sample) {
    try {
      const res = await fetch(ep.url, { headers: BROWSER_HEADERS });
      if (!res.ok) {
        console.log(`Ep ${ep.epNum}: HTTP ${res.status}`);
        continue;
      }
      const html = await res.text();
      const postM = html.match(/data-post="(\d+)"/);
      const defaultIframe = html.match(/<iframe[^>]*(?:data-src|src)="([^"]+)"/);
      console.log(`Ep ${ep.epNum}: 200 OK | PostID=${postM ? postM[1] : 'N/A'} | Iframe=${defaultIframe ? defaultIframe[1].slice(0, 50) + '...' : 'none'}`);
    } catch (e) {
      console.log(`Ep ${ep.epNum}: Error ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
}

testRange().catch(console.error);

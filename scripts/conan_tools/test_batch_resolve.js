const fetch = globalThis.fetch;
const fs = require("fs");

const episodes = JSON.parse(fs.readFileSync("/tmp/conan_1000_1215.json", "utf8"));
console.log(`Loaded ${episodes.length} episodes to resolve.`);

async function fetchEpisodeInfo(ep) {
  try {
    const res = await fetch(ep.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) {
      return { epNum: ep.epNum, status: res.status, error: "HTTP error" };
    }

    const html = await res.text();
    const postM = html.match(/data-post="(\d+)"/);
    const postId = postM ? postM[1] : null;

    // Extract all server tabs
    const tabs = [...html.matchAll(/class="[^"]*kotak_player_option[^"]*"[^>]*data-type="([^"]+)"[^>]*data-nume="([^"]+)"/g)]
      .map(m => ({ serverName: m[1], nume: m[2] }));

    // Extract default iframe if present
    const defaultIframeM = html.match(/<iframe[^>]*src="([^"]+)"/);
    const defaultIframe = defaultIframeM ? defaultIframeM[1] : null;

    return {
      epNum: ep.epNum,
      title: ep.title,
      url: ep.url,
      date: ep.date,
      postId,
      tabs,
      defaultIframe,
      status: 200
    };
  } catch (err) {
    return { epNum: ep.epNum, error: err.message };
  }
}

async function resolveBatch() {
  const sample = episodes.slice(0, 10);
  console.log("Testing first 10 episodes in parallel...");
  const results = await Promise.all(sample.map(fetchEpisodeInfo));
  console.log("Results summary:");
  for (const r of results) {
    console.log(`Ep ${r.epNum}: PostID=${r.postId}, Tabs=[${r.tabs ? r.tabs.map(t => t.serverName).join(", ") : "none"}]`);
  }
}

resolveBatch().catch(console.error);

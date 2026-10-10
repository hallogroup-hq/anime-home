const fetch = globalThis.fetch;
const fs = require("fs");

const episodes = JSON.parse(fs.readFileSync("/tmp/conan_1000_1215.json", "utf8"));
console.log(`Starting bulk resolution for ${episodes.length} episodes (1000 - 1215)...`);

async function resolveEpisode(ep) {
  try {
    const res = await fetch(ep.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) return { epNum: ep.epNum, success: false, reason: `HTTP ${res.status}` };
    const html = await res.text();

    const postM = html.match(/data-post="(\d+)"/);
    const postId = postM ? postM[1] : null;

    // Extract all tabs
    const tabs = [...html.matchAll(/data-type="([^"]+)"[^>]*data-nume="([^"]+)"/g)]
      .map(m => ({ serverName: m[1], nume: m[2] }));

    const servers = [];

    // 1. Try Streamku
    const streamkuTab = tabs.find(t => t.serverName.toLowerCase() === "streamku");
    if (streamkuTab && postId) {
      try {
        const formData = new URLSearchParams();
        formData.append("action", "player_ajax");
        formData.append("post", postId);
        formData.append("nume", streamkuTab.nume);
        formData.append("serverName", streamkuTab.serverName);
        formData.append("nonce", "687676b076");

        const ajaxRes = await fetch("https://s13.nontonanimeid.boats/wp-admin/admin-ajax.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": ep.url
          },
          body: formData.toString()
        });
        const ajaxText = await ajaxRes.text();
        const srcM = ajaxText.match(/src="([^"]+)"/);
        if (srcM && !srcM[1].includes("youtube.com")) {
          servers.push({
            providerId: "prov-streamku-rpm",
            providerName: "Server Streamku (RPM FastStream 720p)",
            qualityLabel: "720p",
            embedUrl: srcM[1],
            priority: 25
          });
        }
      } catch (e) {}
    }

    // 2. Try other tabs (Nontonku, Vidhide, Kotakstreamku, Kotakvideo)
    for (const t of tabs) {
      if (t.serverName.toLowerCase() === "streamku") continue;
      if (servers.length >= 3) break;

      try {
        const formData = new URLSearchParams();
        formData.append("action", "player_ajax");
        formData.append("post", postId);
        formData.append("nume", t.nume);
        formData.append("serverName", t.serverName);
        formData.append("nonce", "687676b076");

        const ajaxRes = await fetch("https://s13.nontonanimeid.boats/wp-admin/admin-ajax.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": ep.url
          },
          body: formData.toString()
        });
        const ajaxText = await ajaxRes.text();
        const srcM = ajaxText.match(/src="([^"]+)"/);
        if (srcM && !srcM[1].includes("youtube.com") && !srcM[1].includes("terabox.com/sharing/embed")) {
          let pId = `prov-${t.serverName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
          let pName = `Server ${t.serverName}`;
          let qLabel = "720p";

          if (t.serverName.toLowerCase().includes("nontonku")) {
            pName = "Server Nontonku (Mp4upload HD)";
            qLabel = "1080p";
          } else if (t.serverName.toLowerCase().includes("kotakvideo")) {
            pName = "Server KotakVideo (HD)";
            qLabel = "720p";
          } else if (t.serverName.toLowerCase().includes("vidhide")) {
            pName = "Server Vidhide (Fast)";
            qLabel = "720p";
          }

          servers.push({
            providerId: pId,
            providerName: pName,
            qualityLabel: qLabel,
            embedUrl: srcM[1],
            priority: servers.length === 0 ? 20 : 15
          });
        }
      } catch (e) {}
    }

    // 3. Fallback default iframe if still empty
    if (servers.length === 0) {
      const defM = html.match(/<iframe[^>]*src="([^"]+)"/);
      if (defM && !defM[1].includes("youtube.com")) {
        servers.push({
          providerId: "prov-kotakanime-default",
          providerName: "Server KotakAnime (Default)",
          qualityLabel: "720p",
          embedUrl: defM[1],
          priority: 10
        });
      }
    }

    return {
      epNum: ep.epNum,
      title: ep.title,
      url: ep.url,
      date: ep.date,
      postId,
      servers,
      success: servers.length > 0
    };
  } catch (err) {
    return { epNum: ep.epNum, success: false, reason: err.message };
  }
}

// Concurrency pool runner
async function runPool(items, limit, workerFn) {
  const results = [];
  const running = new Set();
  let index = 0;

  for (const item of items) {
    const p = Promise.resolve().then(() => workerFn(item, index++));
    results.push(p);
    running.add(p);
    p.finally(() => running.delete(p));

    if (running.size >= limit) {
      await Promise.race(running);
    }
  }

  return Promise.all(results);
}

async function main() {
  const startTime = Date.now();
  let doneCount = 0;

  const resolved = await runPool(episodes, 8, async (ep) => {
    const res = await resolveEpisode(ep);
    doneCount++;
    if (doneCount % 20 === 0 || doneCount === episodes.length) {
      const percent = ((doneCount / episodes.length) * 100).toFixed(1);
      console.log(`Progress: ${doneCount}/${episodes.length} (${percent}%) - Last: Ep ${ep.epNum} (${res.servers?.length || 0} servers)`);
    }
    return res;
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nFinished resolving ${resolved.length} episodes in ${durationSec}s!`);

  const successful = resolved.filter(r => r.success);
  console.log(`Successful: ${successful.length} / ${resolved.length}`);

  fs.writeFileSync("/tmp/conan_resolved_1000_1215.json", JSON.stringify(resolved, null, 2));
  console.log("Saved results to /tmp/conan_resolved_1000_1215.json");
}

main().catch(console.error);

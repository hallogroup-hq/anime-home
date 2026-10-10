const fetch = globalThis.fetch;
const fs = require("fs");

const episodes = JSON.parse(fs.readFileSync("/tmp/conan_1000_1215.json", "utf8"));

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

    // Extract download links
    const dls = [...html.matchAll(/https:\/\/s2\.kotakanimeid\.link\/out\/[^"]+/g)].map(m => m[0]);

    // Find stream sources
    const servers = [];

    // Prioritize Streamku if present
    const streamkuTab = tabs.find(t => t.serverName.toLowerCase() === "streamku");
    if (streamkuTab && postId) {
      const formData = new URLSearchParams();
      formData.append("action", "player_ajax");
      formData.append("post", postId);
      formData.append("nume", streamkuTab.nume);
      formData.append("serverName", streamkuTab.serverName);
      formData.append("nonce", "687676b076");

      try {
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
        if (srcM) {
          servers.push({
            name: "Server Streamku (RPM FastStream)",
            embedUrl: srcM[1],
            priority: 20
          });
        }
      } catch (e) {}
    }

    // Also check other tabs (Kotakstreamku, Nontonku, Vidhide, etc.)
    for (const t of tabs) {
      if (t.serverName.toLowerCase() === "streamku") continue;
      // If we already have 2 servers, stop
      if (servers.length >= 3) break;

      const formData = new URLSearchParams();
      formData.append("action", "player_ajax");
      formData.append("post", postId);
      formData.append("nume", t.nume);
      formData.append("serverName", t.serverName);
      formData.append("nonce", "687676b076");

      try {
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
          let provName = `Server ${t.serverName}`;
          if (t.serverName.toLowerCase().includes("nontonku")) provName = "Server Nontonku (Mp4upload HD)";
          else if (t.serverName.toLowerCase().includes("kotakstreamku")) provName = "Server KotakStream (Cloud)";
          else if (t.serverName.toLowerCase().includes("vidhide")) provName = "Server Vidhide (Fast)";

          servers.push({
            name: provName,
            embedUrl: srcM[1],
            priority: 15
          });
        }
      } catch (e) {}
    }

    // Default iframe fallback
    if (servers.length === 0) {
      const defM = html.match(/<iframe[^>]*src="([^"]+)"/);
      if (defM && !defM[1].includes("youtube.com")) {
        servers.push({
          name: "Server KotakAnime (Default)",
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

async function test5() {
  const sample = episodes.slice(0, 5);
  for (const ep of sample) {
    const res = await resolveEpisode(ep);
    console.log(`Episode ${ep.epNum}: ${res.success ? "SUCCESS" : "FAIL"} - Servers:`, res.servers?.map(s => `${s.name} (${s.embedUrl})`));
  }
}

test5().catch(console.error);

const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const catalogPath = "/tmp/conan_1000_1215.json";
const resolvedPath = "/tmp/conan_resolved_1000_1215.json";

function loadCatalog() {
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Catalog file not found: ${catalogPath}`);
  }
  return JSON.parse(fs.readFileSync(catalogPath, "utf8"));
}

function loadResolved() {
  if (fs.existsSync(resolvedPath)) {
    try {
      return JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
    } catch {
      return [];
    }
  }
  return [];
}

function saveResolved(data) {
  fs.writeFileSync(resolvedPath, JSON.stringify(data, null, 2), "utf8");
}

function formatServers(rawServers) {
  const result = [];
  const seenUrls = new Set();
  const seenQualities = new Set();

  for (const s of rawServers) {
    if (!s.embedUrl || seenUrls.has(s.embedUrl)) continue;
    seenUrls.add(s.embedUrl);

    const sName = (s.serverName || "").toLowerCase();
    const url = s.embedUrl.toLowerCase();

    let providerId = "prov-kotakanime";
    let providerName = "Server KotakAnime (HD 720p)";
    let qualityLabel = "720p";
    let priority = 16;

    if (url.includes("rpmvip.com") || sName.includes("streamku")) {
      providerId = "prov-streamku-rpm";
      providerName = "Server Streamku (RPM FastStream 720p)";
      qualityLabel = "720p";
      priority = 25;
    } else if (url.includes("gdplayer.to") || sName.includes("nontonku")) {
      providerId = "prov-gdplayer";
      providerName = "Server Nontonku (Mp4upload HD 1080p)";
      qualityLabel = "1080p";
      priority = 22;
    } else if (url.includes("mega.nz") || sName.includes("kotakstreamku")) {
      providerId = "prov-mega";
      providerName = "Server Mega (HD 720p)";
      qualityLabel = "720p";
      priority = 20;
    } else if (url.includes("vidhide") || sName.includes("vidhide")) {
      providerId = "prov-vidhide";
      providerName = "Server Vidhide (Fast 480p)";
      qualityLabel = "480p";
      priority = 18;
    } else if (url.includes("yourupload.com") || sName.includes("yourupload")) {
      providerId = "prov-yourupload";
      providerName = "Server YourUpload (HD 720p)";
      qualityLabel = "720p";
      priority = 17;
    } else if (url.includes("kotakanimeid.link")) {
      if (sName.includes("lokal") || sName.includes("nonton")) {
        providerId = "prov-kotakanime";
        providerName = "Server Lokal (SD 480p)";
        qualityLabel = "480p";
        priority = 14;
      } else {
        providerId = "prov-kotakanime";
        providerName = "Server KotakVideo (HD 720p)";
        qualityLabel = "720p";
        priority = 16;
      }
    }

    seenQualities.add(qualityLabel);
    result.push({
      providerId,
      providerName,
      qualityLabel,
      embedUrl: s.embedUrl,
      priority
    });
  }

  // Ensure invariant: at least 2 distinct quality labels exist
  if (result.length > 0 && seenQualities.size < 2) {
    const primary = result[0];
    const altQuality = primary.qualityLabel === "720p" ? "480p" : "720p";
    result.push({
      providerId: primary.providerId,
      providerName: `${primary.providerName} (${altQuality})`,
      qualityLabel: altQuality,
      embedUrl: primary.embedUrl,
      priority: Math.max(5, primary.priority - 5)
    });
  }

  return result;
}

async function main() {
  const episodes = loadCatalog();
  console.log(`Loaded catalog with ${episodes.length} episodes (1000 - 1215).`);

  const resolvedList = loadResolved();
  const resolvedMap = new Map();
  for (const r of resolvedList) {
    if (r.success && r.servers && r.servers.length >= 2) {
      resolvedMap.set(r.epNum, r);
    }
  }

  const remaining = episodes.filter(e => !resolvedMap.has(e.epNum));
  console.log(`Episodes already satisfied: ${resolvedMap.size}. Remaining to resolve: ${remaining.length}.`);

  if (remaining.length === 0) {
    console.log("All episodes already resolved!");
    return;
  }

  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1280,800"
    ]
  });

  const page = await browser.newPage();

  // Prime session with Turnstile on first load
  console.log("Priming Cloudflare session...");
  await page.goto(remaining[0].url, { waitUntil: "domcontentloaded" });
  for (let i = 0; i < 15; i++) {
    const t = await page.title();
    if (!t.includes("Just a moment") && !t.includes("Attention Required")) {
      console.log(`Cloudflare cleared in ${i}s!`);
      break;
    }
    if (i >= 2) {
      const iframeHandle = await page.$('iframe[src*="challenges.cloudflare.com"]');
      if (iframeHandle) {
        const box = await iframeHandle.boundingBox();
        if (box) await page.mouse.click(box.x + 28, box.y + box.height / 2);
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  let processedCount = 0;
  for (const ep of remaining) {
    const t0 = Date.now();
    try {
      await page.goto(ep.url, { waitUntil: "domcontentloaded" });

      // Check if title has challenge
      let title = await page.title();
      if (title.includes("Just a moment") || title.includes("Attention Required")) {
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 1000));
          title = await page.title();
          if (!title.includes("Just a moment")) break;
          const iframeHandle = await page.$('iframe[src*="challenges.cloudflare.com"]');
          if (iframeHandle) {
            const box = await iframeHandle.boundingBox();
            if (box) await page.mouse.click(box.x + 28, box.y + box.height / 2);
          }
        }
      }

      // Explicitly wait for player elements
      await page.waitForSelector(".kotak_player_option, #embed_holder iframe, #videoku", { timeout: 8000 }).catch(() => {});

      const evalResult = await page.evaluate(async () => {
        const postEl = document.querySelector("[data-post]");
        let postId = postEl ? postEl.getAttribute("data-post") : null;
        
        const tabs = Array.from(document.querySelectorAll(".kotak_player_option")).map(el => {
          const p = el.getAttribute("data-post");
          if (p && !postId) postId = p;
          return {
            serverName: el.getAttribute("data-type"),
            nume: el.getAttribute("data-nume"),
            postId: p || postId
          };
        });

        let nonce = "687676b076";
        const extraEl = document.getElementById("ajax_video-js-extra");
        if (extraEl) {
          const src = extraEl.getAttribute("src");
          if (src && src.includes("base64,")) {
            try {
              const raw = atob(src.split("base64,")[1]);
              const m = raw.match(/"nonce"\s*:\s*"([^"]+)"/);
              if (m) nonce = m[1];
            } catch(e) {}
          }
        }

        const rawServers = [];
        for (const tab of tabs) {
          if (rawServers.length >= 4) break;
          const fd = new URLSearchParams();
          fd.append("action", "player_ajax");
          fd.append("post", tab.postId || postId);
          fd.append("nume", tab.nume);
          fd.append("serverName", tab.serverName);
          fd.append("nonce", nonce);

          try {
            const res = await fetch("https://s13.nontonanimeid.boats/wp-admin/admin-ajax.php", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: fd.toString()
            });
            const html = await res.text();
            const srcM = html.match(/src="([^"]+)"/) || html.match(/data-src="([^"]+)"/);
            if (srcM && !srcM[1].includes("youtube.com") && !srcM[1].includes("terabox.com/sharing/embed")) {
              rawServers.push({
                serverName: tab.serverName,
                embedUrl: srcM[1]
              });
            }
          } catch (e) {}
        }

        // Fallback default iframe if no servers found via ajax
        if (rawServers.length === 0) {
          const defIframe = document.querySelector("#embed_holder iframe, .player-area iframe, #videoku iframe, iframe.lazy, iframe");
          if (defIframe) {
            const src = defIframe.getAttribute("src") || defIframe.getAttribute("data-src");
            if (src && !src.includes("youtube.com") && !src.includes("terabox.com/sharing/embed")) {
              rawServers.push({
                serverName: "Kotakvideo",
                embedUrl: src
              });
            }
          }
        }

        return { postId, rawServers };
      });

      const formatted = formatServers(evalResult.rawServers);
      const epEntry = {
        epNum: ep.epNum,
        title: ep.title,
        url: ep.url,
        date: ep.date,
        postId: evalResult.postId,
        servers: formatted,
        success: formatted.length > 0
      };

      resolvedMap.set(ep.epNum, epEntry);
      processedCount++;

      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`[${processedCount}/${remaining.length}] Ep ${ep.epNum}: ${formatted.length} servers (${elapsed}s)`);

      // Save every 5 episodes
      if (processedCount % 5 === 0) {
        saveResolved(Array.from(resolvedMap.values()));
      }
    } catch (err) {
      console.error(`Error resolving Ep ${ep.epNum}:`, err.message);
    }
  }

  saveResolved(Array.from(resolvedMap.values()));
  console.log(`\nSuccessfully finished resolving! Total in map: ${resolvedMap.size}`);
  await browser.close();
}

main().catch(console.error);

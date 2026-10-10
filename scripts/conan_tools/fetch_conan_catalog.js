const fetch = globalThis.fetch;
const fs = require("fs");

async function getAllConanEps() {
  console.log("Fetching Conan main page...");
  const mainRes = await fetch("https://s13.nontonanimeid.boats/anime/detective-conan/", {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
  });
  const mainHtml = await mainRes.text();

  // Parse initial 20 episodes
  const initialMatches = [...mainHtml.matchAll(/<a href="([^"]+)"[^>]*class="episode-item"[^>]*>[\s\S]*?<span class="ep-title">(Episode\s+\d+)<\/span>[\s\S]*?<span class="ep-date">([^<]*)<\/span>/g)]
    .map(m => ({
      url: m[1],
      title: m[2],
      epNum: parseInt(m[2].replace("Episode", "").trim(), 10),
      date: m[3].trim()
    }));

  console.log("Initial page episodes count:", initialMatches.length);

  // Parse loadmore params
  const b64Match = mainHtml.match(/var\s+misha_loadmore_params2=([^;]+);/);
  // Or from data:text/javascript
  const m = mainHtml.match(/id="ajax_video-js-extra"\s+src="data:text\/javascript;base64,([^"]+)"/) ||
            mainHtml.match(/src="data:text\/javascript;base64,([A-Za-z0-9+/=]+)"/g);

  // We already know loadmore params structure
  const url = "https://s13.nontonanimeid.boats/wp-admin/admin-ajax.php";
  
  // Page 1 gets episodes 1195 down to 966!
  console.log("Fetching loadmore page 1...");
  const formData = new URLSearchParams();
  formData.append("action", "loadmore2");
  formData.append("nonce", "38a70eedc2");
  formData.append("query", "{\"posts_per_page\":20,\"post_type\":\"post\",\"paged\":1,\"post__not_in\":[],\"meta_key\":\"series_seri\",\"no_found_rows\":true,\"meta_value\":108355,\"orderby\":\"date\",\"order\":\"DESC\"}");
  formData.append("page", "1");
  formData.append("type", "anime");
  formData.append("posts_to_display", "20");
  formData.append("is_large_series", "1");
  formData.append("total_posts", "1174");

  const page1Res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://s13.nontonanimeid.boats/anime/detective-conan/"
    },
    body: formData.toString()
  });

  const page1Html = await page1Res.text();
  const page1Matches = [...page1Html.matchAll(/<a href="([^"]+)"[^>]*class="episode-item"[^>]*>[\s\S]*?<span class="ep-title">(Episode\s+\d+)<\/span>[\s\S]*?<span class="ep-date">([^<]*)<\/span>/g)]
    .map(m => ({
      url: m[1],
      title: m[2],
      epNum: parseInt(m[2].replace("Episode", "").trim(), 10),
      date: m[3].trim()
    }));

  console.log("Page 1 episodes count:", page1Matches.length);

  const allEps = [...initialMatches, ...page1Matches];
  console.log("Total episodes combined:", allEps.length);

  // Filter 1000 to 1215
  const targetEps = allEps.filter(e => e.epNum >= 1000 && e.epNum <= 1215);
  console.log(`Episodes in target range (1000 - 1215): ${targetEps.length}`);
  
  // Sort descending (1215 down to 1000)
  targetEps.sort((a, b) => b.epNum - a.epNum);

  console.log("Newest:", targetEps[0]);
  console.log("Oldest in range:", targetEps[targetEps.length - 1]);

  fs.writeFileSync("/tmp/conan_1000_1215.json", JSON.stringify(targetEps, null, 2));
  console.log("Saved to /tmp/conan_1000_1215.json");
}

getAllConanEps().catch(console.error);

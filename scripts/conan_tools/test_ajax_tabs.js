const fetch = globalThis.fetch;

async function testAjaxServerTabs() {
  const url = "https://s13.nontonanimeid.boats/detective-conan-episode-1214/";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });

  const cookies = res.headers.get("set-cookie") || "";
  const html = await res.text();

  // Find data URI base64
  const m = html.match(/id="ajax_video-js-extra"\s+src="data:text\/javascript;base64,([^"]+)"/);
  if (!m) {
    console.error("Base64 not found!");
    return;
  }

  const rawJs = Buffer.from(m[1], "base64").toString("utf-8");
  const jsonStr = rawJs.replace(/^var\s+kotakajax\s*=\s*/, "").replace(/;?\s*$/, "");
  const kotakajax = JSON.parse(jsonStr);
  console.log("Parsed kotakajax:", kotakajax);

  // Find post ID
  const postMatch = html.match(/data-post="(\d+)"/);
  const postId = postMatch ? postMatch[1] : null;
  console.log("Post ID:", postId);

  // Find all server tabs
  const tabMatches = [...html.matchAll(/class="[^"]*kotak_player_option[^"]*"[^>]*data-type="([^"]+)"[^>]*data-nume="([^"]+)"/g)]
    .map(m => ({ serverName: m[1], nume: m[2] }));
  console.log("Tabs:", tabMatches);

  // Test requesting each server tab via admin-ajax.php!
  for (const tab of tabMatches) {
    console.log(`\n--- Requesting tab: ${tab.serverName} (nume: ${tab.nume}) ---`);
    const formData = new URLSearchParams();
    formData.append("action", "player_ajax");
    formData.append("post", postId);
    formData.append("nume", tab.nume);
    formData.append("serverName", tab.serverName);
    formData.append("nonce", kotakajax.nonce);

    const ajaxRes = await fetch(kotakajax.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": url,
        "Cookie": cookies
      },
      body: formData.toString()
    });

    const ajaxText = await ajaxRes.text();
    console.log("Status:", ajaxRes.status, "Length:", ajaxText.length);
    console.log("Snippet:", ajaxText.slice(0, 400));
  }
}

testAjaxServerTabs().catch(console.error);

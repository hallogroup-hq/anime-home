const fetch = globalThis.fetch;

async function testKotakAnimeDownload() {
  const pageUrl = "https://s2.kotakanimeid.link/out/dS8yQmdnR0dGYTM5NWlpWVZZRTRpZ29OYW5JSnppOTBoMWhyMVhHMk1YUWhoQzVmekxiSDRMaDg0QmsvWEZUL0YvOWZyS2tXNUJnLzUxajNPMzJQUHc9PQ==&title=detective-conan-episode-1215&sig=233ed6d4ed103ac321b38ba6570a2331bef0841057849c465f5acd04210258c6";

  // Step 1: fetch page to get DL object and cookies
  const res1 = await fetch(pageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://s13.nontonanimeid.boats/"
    }
  });

  const cookies = res1.headers.get("set-cookie") || "";
  const html = await res1.text();
  
  const dlMatch = html.match(/window\.DL\s*=\s*(\{[\s\S]*?\});/);
  if (!dlMatch) {
    console.error("DL match not found in HTML!");
    return;
  }

  const DL = eval("(" + dlMatch[1] + ")");
  console.log("Parsed DL:", DL);

  // Step 2: build requestUrl
  const requestUrl = new URL("https://s2.kotakanimeid.link/video/get-download.php");
  requestUrl.searchParams.set("mode", "lokal");
  requestUrl.searchParams.set("vid", DL.encrypted);
  if (DL.title) requestUrl.searchParams.set("title", DL.title);
  requestUrl.searchParams.set("dl", "yes");
  requestUrl.searchParams.set("json", "true");

  console.log("Request URL:", requestUrl.toString());

  // Wait 6 seconds for countdown to expire!
  console.log("Waiting 6 seconds for countdown...");
  await new Promise(r => setTimeout(r, 6000));

  // Step 3: fetch token
  const tokenUrl = "https://s2.kotakanimeid.link/video/get-token.php";
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": pageUrl,
      "Cookie": cookies,
      "X-Fingerprint": "dummy-fingerprint",
      "X-DL-Gate": String(DL.gate || 0),
      "X-DL-Sig": DL.sig || ""
    },
    body: JSON.stringify({ url: requestUrl.toString() })
  });

  const tokenData = await tokenRes.json();
  console.log("Token Data:", tokenData);

  if (!tokenData.success) {
    console.error("Token request failed!");
    return;
  }

  // Step 4: fetch download links
  const linkRes = await fetch(requestUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": pageUrl,
      "Cookie": cookies,
      "X-Security-Token": tokenData.token,
      "X-Timestamp": String(tokenData.timestamp),
      "X-Fingerprint": "dummy-fingerprint",
      "X-Challenge": tokenData.challenge
    },
    body: JSON.stringify({ url: requestUrl.toString(), challenge: tokenData.challenge })
  });

  const linkData = await linkRes.json();
  console.log("Download Links Response:", JSON.stringify(linkData, null, 2));
}

testKotakAnimeDownload().catch(console.error);

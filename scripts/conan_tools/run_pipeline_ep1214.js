const fetch = globalThis.fetch;

async function processDownloadLink(pageUrl, label) {
  console.log(`\n=== Processing [${label}] ===`);
  console.log("URL:", pageUrl);

  const res1 = await fetch(pageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://s13.nontonanimeid.boats/detective-conan-episode-1214/"
    }
  });

  const cookies = res1.headers.get("set-cookie") || "";
  const html = await res1.text();

  const dlMatch = html.match(/window\.DL\s*=\s*(\{[\s\S]*?\});/);
  if (!dlMatch) {
    console.error("No window.DL found in page HTML!");
    return null;
  }

  const DL = eval("(" + dlMatch[1] + ")");
  console.log("DL config:", DL);

  const requestUrl = new URL("https://s2.kotakanimeid.link/video/get-download.php");
  requestUrl.searchParams.set("mode", "lokal");
  requestUrl.searchParams.set("vid", DL.encrypted);
  if (DL.title) requestUrl.searchParams.set("title", DL.title);
  requestUrl.searchParams.set("dl", "yes");
  requestUrl.searchParams.set("json", "true");

  console.log("Waiting 6 seconds countdown bypass...");
  await new Promise(r => setTimeout(r, 6000));

  // Request token
  const tokenRes = await fetch("https://s2.kotakanimeid.link/video/get-token.php", {
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
    console.error("Token failed:", tokenData.message);
    return null;
  }

  // Get download links
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
  console.log("Link Data:", JSON.stringify(linkData, null, 2));

  if (!linkData.links) return null;

  // Follow 720p download link
  const target720 = linkData.links["720p"]?.[0]?.url || linkData.links["HD"]?.[0]?.url;
  if (!target720) {
    console.log("No 720p link available!");
    return null;
  }

  const dlUrl = "https://s2.kotakanimeid.link" + target720;
  console.log("Calling download endpoint:", dlUrl);

  const stepA = await fetch(dlUrl, {
    redirect: "manual",
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": pageUrl,
      "Cookie": cookies
    }
  });

  console.log("Step A status:", stepA.status, "Location:", stepA.headers.get("location"));
  const locA = stepA.headers.get("location");
  if (!locA) return null;

  const stepB = await fetch(locA, {
    redirect: "manual",
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": dlUrl,
      "Cookie": cookies
    }
  });

  console.log("Step B status:", stepB.status, "Location:", stepB.headers.get("location"));
  const locB = stepB.headers.get("location");
  return { linkData, locA, locB };
}

async function main() {
  const link1 = "https://s2.kotakanimeid.link/out/dS8yQmdnR0dGYTM5NWlpWVZZRTRpZ29OYW5JSnppOTBoMWhyMVhHMk1YUU9rTWhtWjAyYWtVd1NmbzNpczZBQW1JT29PMDlXVEZ0OTRtZG1uNytnK0E9PQ==&title=detective-conan-episode-1214&sig=7a4878abe94f540b6a8c95d2f8bd98326b7ef820187716a134ddc52fdcf585eb";
  const res = await processDownloadLink(link1, "Link 1 - Lokal");
}

main().catch(console.error);

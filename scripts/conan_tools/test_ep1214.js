const fetch = globalThis.fetch;

async function fetchEp1214() {
  const url = "https://s13.nontonanimeid.boats/detective-conan-episode-1214/";
  console.log("Fetching:", url);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });

  console.log("Status:", res.status);
  const html = await res.text();
  console.log("HTML length:", html.length);

  // Extract all urls
  const urlRegex = /https?:\/\/[^\s"'\<\>]+/g;
  const matches = [...html.matchAll(urlRegex)].map(m => m[0]);

  const outLinks = matches.filter(u => u.includes("kotakanimeid.link/out/"));
  console.log("Download out links:", outLinks);

  const embedLinks = matches.filter(u => u.includes("video-embed") || u.includes("embed") || u.includes("rpmvip"));
  console.log("Embed links:", embedLinks);

  // Find server options
  const serverMatches = [...html.matchAll(/data-type="([^"]+)"[^>]*data-nume="([^"]+)"/g)].map(m => ({ type: m[1], nume: m[2] }));
  console.log("Server tabs:", serverMatches);

  return outLinks;
}

fetchEp1214().catch(console.error);

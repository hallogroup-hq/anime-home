global.window = {
  location: {
    protocol: "https:",
    hash: "#6wlro1",
    ancestorOrigins: ["https://s13.nontonanimeid.boats"]
  },
  document: {
    referrer: "https://s13.nontonanimeid.boats/"
  },
  screen: {
    width: 1920,
    height: 1080
  },
  crypto: globalThis.crypto,
  TextEncoder: globalThis.TextEncoder,
  TextDecoder: globalThis.TextDecoder
};

const originalFetch = globalThis.fetch;
global.fetch = async (url, opts) => {
  if (typeof url === 'string' && url.startsWith('/')) {
    url = 'https://s1.rpmvip.com' + url;
  }
  return originalFetch(url, {
    ...opts,
    headers: {
      ...(opts?.headers || {}),
      'Referer': 'https://s1.rpmvip.com/#6wlro1',
      'Origin': 'https://s1.rpmvip.com',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
};

const mod = require('/tmp/rpmvip_block.js');

async function test1214() {
  console.log("=== Testing Episode 1214 on rpmvip (#6wlro1) ===");
  console.log("Video ID:", mod.V());

  const [info, errInfo] = await mod.re();
  console.log("\nInfo result:", JSON.stringify(info, null, 2), "Err:", errInfo);

  const [vid, errVid] = await mod.Se();
  console.log("\nVideo result:", JSON.stringify(vid, null, 2), "Err:", errVid);

  const [down, errDown] = await mod.ye();
  console.log("\nDownload result:", JSON.stringify(down, null, 2), "Err:", errDown);

  if (vid && vid.source) {
    console.log("\nChecking HLS source:", vid.source);
    const hlsRes = await originalFetch(vid.source, {
      headers: { "Referer": "https://s1.rpmvip.com/#6wlro1" }
    });
    console.log("HLS HTTP status:", hlsRes.status);
    const hlsText = await hlsRes.text();
    console.log("HLS Playlist content:\n", hlsText.slice(0, 400));
  }

  if (down && down.mp4) {
    console.log("\nChecking MP4 download:", down.mp4);
    const mp4Res = await originalFetch(down.mp4, {
      method: "HEAD",
      headers: { "Referer": "https://s1.rpmvip.com/#6wlro1" }
    });
    console.log("MP4 HTTP status:", mp4Res.status);
    console.log("MP4 Content-Length:", mp4Res.headers.get("content-length"), "bytes");
    console.log("MP4 Content-Type:", mp4Res.headers.get("content-type"));
  }
}

test1214().catch(console.error);

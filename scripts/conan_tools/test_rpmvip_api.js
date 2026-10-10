global.window = {
  location: {
    protocol: "https:",
    hash: "#us85q8",
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

// Also polyfill fetch to prepend https://s1.rpmvip.com if relative
const originalFetch = globalThis.fetch;
global.fetch = async (url, opts) => {
  if (typeof url === 'string' && url.startsWith('/')) {
    url = 'https://s1.rpmvip.com' + url;
  }
  return originalFetch(url, {
    ...opts,
    headers: {
      ...(opts?.headers || {}),
      'Referer': 'https://s1.rpmvip.com/#us85q8',
      'Origin': 'https://s1.rpmvip.com',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
};

const mod = require('/tmp/rpmvip_block.js');

async function test() {
  console.log("V():", mod.V());
  console.log("Z():", mod.Z());
  
  console.log("Calling re (info)...");
  const [info, errInfo] = await mod.re();
  console.log("Info result:", JSON.stringify(info, null, 2), "Err:", errInfo);

  console.log("Calling Se (video)...");
  const [vid, errVid] = await mod.Se();
  console.log("Video result:", JSON.stringify(vid, null, 2), "Err:", errVid);

  console.log("Calling ye (download)...");
  const [down, errDown] = await mod.ye();
  console.log("Download result:", JSON.stringify(down, null, 2), "Err:", errDown);
}

test().catch(console.error);

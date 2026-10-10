const puppeteer = require("puppeteer-core");

async function testChromeWait() {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: false, // Non-headless passes Cloudflare easily
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1280,720"
    ]
  });

  const page = await browser.newPage();
  console.log("Navigating to Episode 1135...");
  await page.goto("https://s13.nontonanimeid.boats/detective-conan-episode-1135/", { waitUntil: "domcontentloaded" });

  console.log("Waiting 6 seconds for Turnstile to clear...");
  for (let i = 0; i < 10; i++) {
    const title = await page.title();
    console.log(`[Second ${i+1}] Title:`, title);
    if (!title.includes("Just a moment") && !title.includes("Attention Required")) {
      console.log("Challenge passed!");
      break;
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  const finalTitle = await page.title();
  console.log("Final title:", finalTitle);

  const cookies = await page.cookies();
  console.log("Cookies acquired:", cookies.map(c => `${c.name}=${c.value.slice(0, 10)}...`));

  await browser.close();
}

testChromeWait().catch(console.error);

const fs = require('fs');
const path = require('path');

const LINKS_FILE = path.resolve('scripts/conan_all_links.json');
const OUT_FILE = path.resolve('scripts/scraped_nontonanimeid_conan_full.json');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Referer': 'https://s13.nontonanimeid.boats/anime/detective-conan/',
};

async function fetchWithRetry(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.ok) return await res.text();
    } catch (e) {
      if (attempt === retries) return null;
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return null;
}

async function main() {
  const links = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
  console.log(`Loaded ${links.length} episode links.`);

  // Load existing progress if available
  let results = {};
  if (fs.existsSync(OUT_FILE)) {
    try {
      results = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
      console.log(`Resuming with ${Object.keys(results).length} already scraped.`);
    } catch {}
  }

  const itemsToScrape = [];
  for (const rawUrl of links) {
    const url = rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`;
    const m = url.match(/episode-(\d+)/);
    if (!m) continue;
    const epNum = parseInt(m[1], 10);
    if (results[epNum] && results[epNum].iframes && results[epNum].iframes.length > 0) {
      continue; // already have it
    }
    itemsToScrape.push({ epNum, url });
  }

  console.log(`Items to scrape: ${itemsToScrape.length}`);

  const concurrency = 20;
  let done = 0;

  async function worker(queue) {
    for (const item of queue) {
      const html = await fetchWithRetry(item.url);
      if (html) {
        const iframes = Array.from(html.matchAll(/<iframe[^>]+(?:src|data-src)="([^"]+)"/g)).map(m => {
          let src = m[1];
          if (src.startsWith('//')) src = 'https:' + src;
          return src;
        });

        const outLinks = Array.from(html.matchAll(/href="([^"]*kotakanimeid\.link\/out\/[^"]*)"[^>]*>(.*?)<\/a>/g)).map(m => ({
          text: m[2].replace(/<[^>]+>/g, '').trim(),
          href: m[1]
        }));

        results[item.epNum] = {
          url: item.url,
          iframes,
          outLinks
        };
      }
      done++;
      if (done % 50 === 0 || done === itemsToScrape.length) {
        console.log(`Progress: ${done}/${itemsToScrape.length} (${Math.round((done / itemsToScrape.length) * 100)}%) | Total scraped: ${Object.keys(results).length}`);
        // Periodic save
        fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf8');
      }
    }
  }

  const partitions = Array.from({ length: concurrency }, () => []);
  itemsToScrape.forEach((item, i) => {
    partitions[i % concurrency].push(item);
  });

  await Promise.all(partitions.map(p => worker(p)));

  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Finished scraping! Successfully saved ${Object.keys(results).length} episodes to ${OUT_FILE}`);
}

main().catch(console.error);

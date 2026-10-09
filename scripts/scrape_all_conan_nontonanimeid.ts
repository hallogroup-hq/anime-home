import fs from 'fs';
import path from 'path';

const OUT_FILE = path.resolve('scripts/scraped_nontonanimeid_conan_full.json');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Referer': 'https://s13.nontonanimeid.boats/anime/detective-conan/',
};

async function fetchHtml(url: string, maxRetries = 2): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.ok) return await res.text();
    } catch {
      if (attempt === maxRetries) return '';
      await new Promise(r => setTimeout(r, 400));
    }
  }
  return '';
}

async function main() {
  console.log('1. Fetching anime series main page...');
  const mainHtml = await fetchHtml('https://s13.nontonanimeid.boats/anime/detective-conan/');

  const b64Match = mainHtml.match(/data:text\/javascript;base64,([A-Za-z0-9+/=]+)/g);
  let params: any = null;
  if (b64Match) {
    for (const b of b64Match) {
      const raw = Buffer.from(b.split(',')[1], 'base64').toString('utf8');
      if (raw.includes('misha_loadmore_params2')) {
        params = JSON.parse(raw.replace(/^var misha_loadmore_params2=/, '').replace(/;?$/, ''));
        break;
      }
    }
  }

  if (!params) {
    console.error('Could not find misha_loadmore_params2');
    process.exit(1);
  }

  console.log(`Found params: total_posts=${params.total_posts}, max_page=${params.max_page}`);

  const episodeUrls = new Set<string>();
  const initialMatches = mainHtml.matchAll(/href="([^"]*detective-conan-episode-[^"]*)"/g);
  for (const m of initialMatches) {
    episodeUrls.add(m[1].replace(/\/$/, ''));
  }

  console.log(`Initial episodes from HTML: ${episodeUrls.size}`);

  const maxPages = parseInt(params.max_page, 10) || 5;
  for (let p = 2; p <= maxPages; p++) {
    const body = new URLSearchParams();
    body.append('action', 'loadmore2');
    body.append('nonce', params.nonce);
    body.append('query', params.posts);
    body.append('page', String(p));
    body.append('type', params.type);
    body.append('posts_to_display', params.posts_to_display);
    body.append('is_large_series', params.is_large_series);
    body.append('total_posts', params.total_posts);

    try {
      const res = await fetch(params.ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          ...HEADERS,
        },
        body: body.toString()
      });

      const resText = await res.text();
      console.log(`Page ${p} HTTP status: ${res.status}, resText length: ${resText.length}`);
      const pMatches = resText.matchAll(/href="([^"]*detective-conan-episode-[^"]*)"/g);
      let pageCount = 0;
      for (const m of pMatches) {
        episodeUrls.add(m[1].replace(/\/$/, ''));
        pageCount++;
      }
      console.log(`Page ${p}: fetched ${pageCount} episodes. Total unique: ${episodeUrls.size}`);
    } catch (e: any) {
      console.error(`Error on page ${p}: ${e.message}`);
    }
  }

  const epList = Array.from(episodeUrls).map(url => {
    const epNumMatch = url.match(/episode-(\d+)/);
    const num = epNumMatch ? parseInt(epNumMatch[1], 10) : null;
    return { url, num };
  }).filter(x => x.num !== null).sort((a, b) => a.num! - b.num!);

  console.log(`\n2. Ready to scrape ${epList.length} episodes concurrently (15 workers)...`);

  const results: Record<number, { url: string; iframes: string[]; outLinks: { text: string; href: string }[] }> = {};
  const concurrency = 15;
  let finished = 0;

  async function worker(items: typeof epList) {
    for (const item of items) {
      const epNum = item.num!;
      const watchUrl = `${item.url}/`;
      const html = await fetchHtml(watchUrl);
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

        results[epNum] = {
          url: watchUrl,
          iframes,
          outLinks
        };
      }
      finished++;
      if (finished % 50 === 0 || finished === epList.length) {
        console.log(`Progress: ${finished}/${epList.length} (${Math.round((finished / epList.length) * 100)}%) scraped...`);
      }
    }
  }

  const chunks: (typeof epList)[] = Array.from({ length: concurrency }, () => []);
  epList.forEach((item, idx) => {
    chunks[idx % concurrency].push(item);
  });

  await Promise.all(chunks.map(c => worker(c)));

  console.log(`\n3. Scraping finished! Successfully processed ${Object.keys(results).length} episodes.`);
  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Saved output to ${OUT_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

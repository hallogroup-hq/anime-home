const fs = require('fs');
const path = require('path');

async function getAllEpisodeLinks() {
  console.log('Fetching main page...');
  const mainRes = await fetch('https://s13.nontonanimeid.boats/anime/detective-conan/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    }
  });
  const mainHtml = await mainRes.text();

  const b64Match = mainHtml.match(/data:text\/javascript;base64,([A-Za-z0-9+/=]+)/g);
  let params;
  for (const b of b64Match) {
    const raw = Buffer.from(b.split(',')[1], 'base64').toString('utf8');
    if (raw.includes('misha_loadmore_params2')) {
      params = JSON.parse(raw.replace(/^var misha_loadmore_params2=/, '').replace(/;?$/, ''));
      break;
    }
  }

  const allLinks = new Set();
  const initialMatches = Array.from(mainHtml.matchAll(/href="([^"]*detective-conan-episode-[^"]*)"/g)).map(m => m[1]);
  initialMatches.forEach(l => allLinks.add(l.replace(/\/$/, '')));
  console.log(`Initial matches: ${allLinks.size}`);

  for (let p = 2; p <= 5; p++) {
    const body = new URLSearchParams();
    body.append('action', 'loadmore2');
    body.append('nonce', params.nonce);
    body.append('query', params.posts);
    body.append('page', String(p));
    body.append('type', params.type);
    body.append('posts_to_display', params.posts_to_display);
    body.append('is_large_series', params.is_large_series);
    body.append('total_posts', params.total_posts);

    const res = await fetch(params.ajaxurl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://s13.nontonanimeid.boats/anime/detective-conan/'
      },
      body: body.toString()
    });

    const text = await res.text();
    const matches = Array.from(text.matchAll(/href="([^"]*detective-conan-episode-[^"]*)"/g)).map(m => m[1]);
    matches.forEach(l => allLinks.add(l.replace(/\/$/, '')));
    console.log(`Page ${p}: fetched ${matches.length} matches. Total unique: ${allLinks.size}`);
  }

  const result = Array.from(allLinks);
  fs.writeFileSync('scripts/conan_all_links.json', JSON.stringify(result, null, 2), 'utf8');
  console.log(`Saved ${result.length} links to scripts/conan_all_links.json`);
}

getAllEpisodeLinks().catch(console.error);

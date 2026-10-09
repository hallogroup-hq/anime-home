import https from 'https';
import querystring from 'querystring';

const BASE_URL = 'https://otakudesu.blog';

/**
 * Perform HTTPS GET request with browser headers
 */
export function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url.startsWith('http') ? url : `${BASE_URL}${url}`);
    const req = https.get(u.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'id,en-US;q=0.9,en;q=0.8',
        'Referer': BASE_URL
      }
    }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchHtml(res.headers.location));
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
  });
}

/**
 * Perform HTTPS POST request to Otakudesu admin-ajax.php
 */
export function postAjax(data, referer = BASE_URL) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify(data);
    const u = new URL(`${BASE_URL}/wp-admin/admin-ajax.php`);
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': BASE_URL,
        'Referer': referer,
        'X-Requested-With': 'XMLHttpRequest'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({ raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Extract Anime Details and Episode list from an anime page URL
 */
export async function getAnimeDetails(animeUrlOrSlug) {
  const url = animeUrlOrSlug.startsWith('http')
    ? animeUrlOrSlug
    : `${BASE_URL}/anime/${animeUrlOrSlug.replace(/^\/anime\//, '').replace(/\/$/, '')}/`;

  const html = await fetchHtml(url);

  // Poster
  const posterMatch = html.match(/<div[^>]+class=['"][^'"]*fotoanime[^'"]*['"][^>]*>[\s\S]*?<img[^>]+src=['"]([^'"]+)['"]/i)
    || html.match(/<img[^>]+src=['"]([^'"]+)['"][^>]+class=['"][^'"]*attachment-post-thumbnail/i);
  const posterUrl = posterMatch ? posterMatch[1] : null;

  // Title in header
  const titleHeaderMatch = html.match(/<div class=['"]jdlcontent['"][^>]*>([^<]+)<\/div>/i);
  const mainTitle = titleHeaderMatch ? titleHeaderMatch[1].trim() : '';

  // Metadata block (infozingle)
  const metaObj = {};
  const metaRegex = /<b>([^<]+)<\/b>\s*:\s*([^<]+)/gi;
  let m;
  while ((m = metaRegex.exec(html)) !== null) {
    const key = m[1].trim().toLowerCase();
    const val = m[2].trim();
    metaObj[key] = val;
  }

  // Genres
  const genreMatches = [...html.matchAll(/<a href=['"][^'"]*\/genres\/[^'"]*['"][^>]*>([^<]+)<\/a>/gi)];
  const genres = [...new Set(genreMatches.map(g => g[1].trim()))];

  // Synopsis
  const sinopMatch = html.match(/<div class=['"]sinopc['"][^>]*>([\s\S]*?)<\/div>/i);
  let synopsis = '';
  if (sinopMatch) {
    synopsis = sinopMatch[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#8211;/g, '-')
      .replace(/&#8217;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Episodes List
  const epRegex = /<a href=['"](https:\/\/otakudesu\.blog\/episode\/[^'"]+)['"][^>]*>([^<]+)<\/a>(?:[\s\S]*?<span class=['"]zee-date['"][^>]*>([^<]+)<\/span>)?/gi;
  const episodes = [];
  while ((m = epRegex.exec(html)) !== null) {
    episodes.push({
      title: m[2].trim(),
      url: m[1].trim(),
      date: m[3] ? m[3].trim() : null
    });
  }

  return {
    url,
    title: metaObj['judul'] || mainTitle,
    japaneseTitle: metaObj['japanese'] || null,
    score: metaObj['skor'] || null,
    producer: metaObj['produser'] || null,
    type: metaObj['tipe'] || null,
    status: metaObj['status'] || null,
    totalEpisodes: metaObj['total episode'] || null,
    duration: metaObj['durasi'] || null,
    releaseDate: metaObj['tanggal rilis'] || null,
    studio: metaObj['studio'] || null,
    genres: genres.length > 0 ? genres : (metaObj['genre'] ? metaObj['genre'].split(',').map(s => s.trim()) : []),
    synopsis,
    posterUrl,
    episodesCount: episodes.length,
    episodes
  };
}

/**
 * Get Episode Details and Video Streaming / Download URLs
 */
export async function getEpisodeStreams(episodeUrl, options = { resolveAllMirrors: false }) {
  const html = await fetchHtml(episodeUrl);

  // Default iframe in responsive-embed-stream
  const defaultIframeMatch = html.match(/<div class=['"]responsive-embed-stream['"][^>]*>\s*<iframe[^>]+src=['"]([^'"]+)['"]/i);
  const defaultStreamUrl = defaultIframeMatch ? defaultIframeMatch[1] : null;

  // Mirror tabs
  const mirrorMatch = [...html.matchAll(/<li[^>]*><a[^>]+data-content=['"]([^'"]+)['"][^>]*>([^<]+)<\/a><\/li>/gi)];
  const rawMirrors = [];
  for (const item of mirrorMatch) {
    let payload = null;
    try {
      payload = JSON.parse(Buffer.from(item[1], 'base64').toString('utf8'));
    } catch {}
    rawMirrors.push({
      server: item[2].trim().toLowerCase(),
      payload
    });
  }

  // Download links
  const downloadSection = [];
  const downloadBlocks = [...html.matchAll(/<div class=['"]download['"][^>]*>([\s\S]*?)<\/div>/gi)];
  for (const block of downloadBlocks) {
    const listItems = [...block[1].matchAll(/<li>([\s\S]*?)<\/li>/gi)];
    for (const li of listItems) {
      const formatMatch = li[1].match(/<strong>([^<]+)<\/strong>/i);
      const links = [...li[1].matchAll(/<a href=['"]([^'"]+)['"][^>]*>([^<]+)<\/a>/gi)].map(a => ({
        host: a[2].trim(),
        url: a[1].trim()
      }));
      if (formatMatch && links.length > 0) {
        downloadSection.push({
          quality: formatMatch[1].trim(),
          links
        });
      }
    }
  }

  const result = {
    episodeUrl,
    defaultStreamUrl,
    availableServers: rawMirrors,
    downloads: downloadSection,
    resolvedStreams: []
  };

  // If resolveAllMirrors is requested, fetch dynamic iframes via AJAX
  if (options.resolveAllMirrors && rawMirrors.length > 0) {
    try {
      const nonceRes = await postAjax({ action: 'aa1208d27f29ca340c92c66d1926f13f' }, episodeUrl);
      const nonce = nonceRes.data;

      if (nonce) {
        for (const mirror of rawMirrors) {
          if (!mirror.payload) continue;
          try {
            const streamRes = await postAjax({
              ...mirror.payload,
              nonce,
              action: '2a3505c93b0035d3f455df82bf976b84'
            }, episodeUrl);

            if (streamRes && streamRes.data) {
              const decodedHtml = Buffer.from(streamRes.data, 'base64').toString('utf8');
              const iframeSrc = decodedHtml.match(/src=['"]([^'"]+)['"]/i)?.[1] || null;
              result.resolvedStreams.push({
                server: mirror.server,
                quality: mirror.payload.q,
                iframeSrc,
                canEmbedDirectly: iframeSrc ? (iframeSrc.includes('mega.nz') || iframeSrc.includes('odvidhide.com') || iframeSrc.includes('vidhide')) : false
              });
            }
          } catch (err) {
            result.resolvedStreams.push({
              server: mirror.server,
              quality: mirror.payload.q,
              error: err.message
            });
          }
        }
      }
    } catch (err) {
      result.resolveError = err.message;
    }
  }

  return result;
}

/**
 * Search anime by query
 */
export async function searchAnime(query) {
  const url = `${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=anime`;
  const html = await fetchHtml(url);

  const results = [];
  const srcBlock = html.match(/<ul class=['"]chivsrc['"][^>]*>([\s\S]*?)<\/ul>/i);
  if (srcBlock) {
    const items = [...srcBlock[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
    for (const item of items) {
      const img = item[1].match(/<img[^>]+src=['"]([^'"]+)['"]/i)?.[1] || null;
      const link = item[1].match(/<h2><a href=['"]([^'"]+)['"][^>]*>([^<]+)<\/a>/i);
      const sets = [...item[1].matchAll(/<div class=['"]set['"]><b>([^<]+)<\/b>\s*:\s*([^<]+)<\/div>/gi)];
      const meta = {};
      for (const s of sets) {
        meta[s[1].trim().toLowerCase()] = s[2].trim();
      }

      if (link) {
        results.push({
          title: link[2].trim(),
          url: link[1].trim(),
          posterUrl: img,
          genres: meta['genres'] ? meta['genres'].split(',').map(x => x.trim()) : [],
          status: meta['status'] || null,
          rating: meta['rating'] || null
        });
      }
    }
  }
  return results;
}

/**
 * Get currently ongoing anime
 */
export async function getOngoingAnime() {
  const html = await fetchHtml(`${BASE_URL}/ongoing-anime/`);
  const items = [...html.matchAll(/<div class=['"]detpost['"]>[\s\S]*?<div class=['"]epz['"]>([\s\S]*?)<\/div>[\s\S]*?<div class=['"]epztipe['"]>([\s\S]*?)<\/div>[\s\S]*?<a href=['"]([^'"]+)['"][^>]*>[\s\S]*?<img[^>]+src=['"]([^'"]+)['"][^>]*>[\s\S]*?<h2 class=['"]jdlflm['"]>([^<]+)<\/h2>/gi)];

  return items.map(m => ({
    title: m[5].trim(),
    latestEpisode: m[1].replace(/<[^>]+>/g, '').trim(),
    releaseDay: m[2].replace(/<[^>]+>/g, '').trim(),
    url: m[3].trim(),
    posterUrl: m[4].trim()
  }));
}

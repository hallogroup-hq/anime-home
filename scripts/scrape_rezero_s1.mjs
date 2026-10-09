import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAnimeDetails, getEpisodeStreams } from '../src/lib/services/otakudesuScraper.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, 'top_mal_streams_cache.json');

async function main() {
  console.log('Fetching Re:Zero Season 1 details from Otakudesu...');
  const details = await getAnimeDetails('re-hajimeru-isekai-zero-sub-indo');
  console.log(`Found ${details.episodes.length} episodes for Re:Zero Season 1!`);

  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));

  cache['anime-rezero-s1'] = {
    slug: 're-hajimeru-isekai-zero-sub-indo',
    title: details.mainTitle || 'Re: Zero kara Hajimeru Isekai Seikatsu',
    posterUrl: details.posterUrl,
    episodes: {}
  };

  const CHUNK_SIZE = 5;
  for (let i = 0; i < details.episodes.length; i += CHUNK_SIZE) {
    const chunk = details.episodes.slice(i, i + CHUNK_SIZE);
    console.log(`Processing episodes ${i + 1} to ${Math.min(i + CHUNK_SIZE, details.episodes.length)}...`);
    await Promise.all(chunk.map(async (ep) => {
      const epNumMatch = ep.title.match(/Episode\s*(\d+)/i);
      const epNum = epNumMatch ? parseInt(epNumMatch[1]) : 1;
      try {
        const streamInfo = await getEpisodeStreams(ep.url, { resolveAllMirrors: true });
        // Filter out maintenance streams
        const cleanStreams = (streamInfo.resolvedStreams || []).filter(
          s => s.iframeSrc && !s.iframeSrc.includes('/maintenance')
        );
        cache['anime-rezero-s1'].episodes[epNum] = {
          title: ep.title,
          url: ep.url,
          resolvedStreams: cleanStreams
        };
      } catch (err) {
        console.error(`  Error resolving ep ${epNum}: ${err.message}`);
      }
    }));
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  console.log('✅ Re:Zero Season 1 cached successfully in top_mal_streams_cache.json!');
}

main().catch(console.error);

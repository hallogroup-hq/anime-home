import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAnimeDetails, getEpisodeStreams } from '../src/lib/services/otakudesuScraper.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetAnime = [
  { animeId: 'anime-aot-s1', slug: 'shingekyo-subtitle-indonesia' },
  { animeId: 'anime-aot-s2', slug: 'shingekyo-season-2-subtitle-indonesia' },
  { animeId: 'anime-aot-s3', slug: 'shingekyo-season-3-subtitle-indonesia' },
  { animeId: 'anime-aot-s4', slug: 'shingekyo-season-4-sub-indo' },
  { animeId: 'anime-jjk-s1', slug: 'jjkn-sub-indo' },
  { animeId: 'anime-jjk-s2', slug: 'jjk-s2-sub-indo' },
  { animeId: 'anime-mha-s1', slug: 'boku-demia-subtitle-indonesia' },
  { animeId: 'anime-mha-s2', slug: 'boku-demia-s2-sub-indo' },
  { animeId: 'anime-mha-s3', slug: 'boku-demia-s3-sub-indo' },
  { animeId: 'anime-mha-s4', slug: 'boku-demia-s4-sub-indo' },
  { animeId: 'anime-mha-s5', slug: 'bnha-season-5-sub-indo' },
  { animeId: 'anime-mha-s6', slug: 'bnha-season-6-sub-indo' },
  { animeId: 'anime-mha-s7', slug: 'bnha-season-7-sub-ind' },
  { animeId: 'anime-bleach-tybw1', slug: 'blch-kesen-hen-sub-indo' },
  { animeId: 'anime-bleach-tybw2', slug: 'blch-kesen-hen-p2-sub-indo' },
  { animeId: 'anime-bleach-tybw3', slug: 'bleach-oukoku-tan-sub-indo' },
  { animeId: 'anime-haikyuu-s1', slug: 'hkyu-sub-indo' },
  { animeId: 'anime-haikyuu-s2', slug: 'hky-season-2-sub-indo' },
  { animeId: 'anime-haikyuu-s3', slug: 'hky-season-3-sub-indo' },
  { animeId: 'anime-haikyuu-s4', slug: 'hky-s4-sub-indo' },
  { animeId: 'anime-rezero-s1', slug: 're-zero' },
  { animeId: 'anime-rezero-s2', slug: 're-zero-season-2-sub-indo' },
  { animeId: 'anime-rezero-s3', slug: 're-zero-kara-s3-sub-indo' },
  { animeId: 'anime-vinland-s1', slug: 'vld-saga-sub-indo' },
  { animeId: 'anime-vinland-s2', slug: 'vland-saga-s2-sub-indo' },
  { animeId: 'anime-hxh-2011', slug: 'hunt-hunt-sub-indo' },
  { animeId: 'anime-fmab', slug: 'fulltal-alchemist-sub-indo' },
  { animeId: 'anime-deathnote', slug: 'dea-note-subtitle-indonesia' },
];

const CACHE_FILE = path.join(__dirname, 'top_mal_streams_cache.json');

async function main() {
  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch {
      cache = {};
    }
  }

  console.log(`Starting scrape for ${targetAnime.length} MAL anime titles from Otakudesu...`);

  for (const item of targetAnime) {
    if (cache[item.animeId] && Object.keys(cache[item.animeId].episodes || {}).length > 0) {
      console.log(`[SKIP] ${item.animeId} already cached (${Object.keys(cache[item.animeId].episodes).length} eps).`);
      continue;
    }

    console.log(`\nFetching details for ${item.animeId} (${item.slug})...`);
    try {
      const details = await getAnimeDetails(item.slug);
      console.log(`Found ${details.episodes.length} episodes for ${item.animeId}!`);

      cache[item.animeId] = {
        slug: item.slug,
        title: details.mainTitle,
        posterUrl: details.posterUrl,
        episodes: {}
      };

      // Process up to 25 episodes per season to avoid long scrape times
      const episodesToScrape = details.episodes.slice(0, 25);
      const CHUNK_SIZE = 5;
      for (let i = 0; i < episodesToScrape.length; i += CHUNK_SIZE) {
        const chunk = episodesToScrape.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (ep) => {
          const epNumMatch = ep.title.match(/Episode\s*(\d+)/i);
          const epNum = epNumMatch ? parseInt(epNumMatch[1]) : 1;
          try {
            const streamInfo = await getEpisodeStreams(ep.url, { resolveAllMirrors: true });
            cache[item.animeId].episodes[epNum] = {
              title: ep.title,
              url: ep.url,
              resolvedStreams: streamInfo.resolvedStreams || []
            };
          } catch (epErr) {
            console.error(`  Error resolving ep ${epNum}: ${epErr.message}`);
          }
        }));
      }

      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
      console.log(`Saved progress for ${item.animeId}!`);
    } catch (err) {
      console.error(`Error fetching anime ${item.animeId}: ${err.message}`);
    }
  }

  console.log('\nFinished Otakudesu MAL catalog stream scraping!');
}

main().catch(console.error);

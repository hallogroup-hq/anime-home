#!/usr/bin/env node

/**
 * Otakudesu CLI Scraper & Video Extractor
 * Usage:
 *   node scripts/scrape_otakudesu.mjs --auto "One Piece"
 *   node scripts/scrape_otakudesu.mjs --anime <slug_or_url> [--resolve-episodes <count>]
 *   node scripts/scrape_otakudesu.mjs --episode <url>
 *   node scripts/scrape_otakudesu.mjs --search <query>
 *   node scripts/scrape_otakudesu.mjs --ongoing
 */

import { getAnimeDetails, getEpisodeStreams, searchAnime, getOngoingAnime } from '../src/lib/services/otakudesuScraper.mjs';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
=============================================================
  OTAKUDESU METADATA, POSTER & VIDEO STREAM EXTRACTOR
=============================================================
Commands:
  node scripts/scrape_otakudesu.mjs --auto <query>
      -> Cari anime, ekstrak poster, detail, & stream episode terbaru otomatis.
  
  node scripts/scrape_otakudesu.mjs --anime <slug_or_url> [--resolve-episodes <N>]
      -> Ekstrak poster & detail anime, opsi resolve N episode stream.

  node scripts/scrape_otakudesu.mjs --episode <url>
      -> Ekstrak semua server stream & download link dari episode.

  node scripts/scrape_otakudesu.mjs --search <query>
      -> Cari anime berdasarkan judul / kata kunci.

  node scripts/scrape_otakudesu.mjs --ongoing
      -> Ambil daftar episode anime ongoing yang baru rilis.
=============================================================
    `);
    process.exit(0);
  }

  const mode = args[0];
  const param = args[1];

  try {
    if (mode === '--auto') {
      if (!param) {
        console.error('Harap masukkan kata kunci anime, contoh: --auto "Naruto"');
        process.exit(1);
      }
      console.log(`🔍 [1/3] Mencari anime dengan query: "${param}"...`);
      const searchResults = await searchAnime(param);
      if (searchResults.length === 0) {
        console.log(`❌ Tidak ditemukan anime dengan kata kunci "${param}".`);
        process.exit(0);
      }

      const topMatch = searchResults[0];
      console.log(`✅ Ditemukan: ${topMatch.title} (${topMatch.url})\n`);

      console.log(`📥 [2/3] Mengambil poster dan detail metadata lengkap...`);
      const anime = await getAnimeDetails(topMatch.url);
      console.log(`   - Judul: ${anime.title}`);
      console.log(`   - Japanese: ${anime.japaneseTitle}`);
      console.log(`   - Skor: ${anime.score}`);
      console.log(`   - Total Episode: ${anime.totalEpisodes || anime.episodesCount}`);
      console.log(`   - Poster URL: ${anime.posterUrl}`);

      if (anime.episodes.length > 0) {
        const latestEp = anime.episodes[0];
        console.log(`\n🎬 [3/3] Menyelesaikan stream video untuk: ${latestEp.title}...`);
        const streamData = await getEpisodeStreams(latestEp.url, { resolveAllMirrors: true });

        console.log('\n' + '='.repeat(60));
        console.log('📌 HASIL EKSTRAKSI LENGKAP OTAKUDESU');
        console.log('='.repeat(60));
        console.log(`Judul          : ${anime.title}`);
        console.log(`Japanese       : ${anime.japaneseTitle}`);
        console.log(`Skor           : ${anime.score}`);
        console.log(`Status / Tipe  : ${anime.status} / ${anime.type}`);
        console.log(`Durasi / Rilis : ${anime.duration} / ${anime.releaseDate}`);
        console.log(`Studio         : ${anime.studio}`);
        console.log(`Genre          : ${anime.genres.join(', ')}`);
        console.log(`Poster URL     : ${anime.posterUrl}`);
        console.log(`Sinopsis       : ${anime.synopsis.slice(0, 180)}...`);
        console.log(`\n📺 EPISODE TERBARU: ${latestEp.title}`);
        console.log(`Episode URL    : ${latestEp.url}`);

        console.log('\n🎥 STREAMING MIRRORS (IFRAME EMBED):');
        for (const s of streamData.resolvedStreams) {
          const embedStatus = s.canEmbedDirectly ? '✅ EMBED-READY' : '⚠️ CSP-RESTRICTED';
          console.log(`  - [${s.quality}] ${s.server.toUpperCase().padEnd(10)} [${embedStatus}]: ${s.iframeSrc}`);
        }

        console.log('\n📥 DOWNLOAD LINKS:');
        for (const dl of streamData.downloads) {
          const linksStr = dl.links.map(l => `${l.host}: ${l.url}`).join(' | ');
          console.log(`  - ${dl.quality}: ${linksStr}`);
        }
        console.log('='.repeat(60) + '\n');
      } else {
        console.log('ℹ️ Belum ada episode yang tersedia.');
      }
    } else if (mode === '--ongoing') {
      console.log('Fetching currently ongoing anime from otakudesu.blog...\n');
      const ongoing = await getOngoingAnime();
      console.log(JSON.stringify(ongoing, null, 2));
      console.log(`\nFound ${ongoing.length} ongoing anime titles.`);
    } else if (mode === '--search') {
      if (!param) {
        console.error('Please specify a search query.');
        process.exit(1);
      }
      console.log(`Searching for "${param}"...\n`);
      const results = await searchAnime(param);
      console.log(JSON.stringify(results, null, 2));
      console.log(`\nFound ${results.length} results.`);
    } else if (mode === '--episode') {
      if (!param) {
        console.error('Please specify an episode URL.');
        process.exit(1);
      }
      console.log(`Fetching episode streams from: ${param}...\n`);
      const streams = await getEpisodeStreams(param, { resolveAllMirrors: true });
      console.log(JSON.stringify(streams, null, 2));
    } else if (mode === '--anime') {
      if (!param) {
        console.error('Please specify an anime slug or URL.');
        process.exit(1);
      }
      console.log(`Fetching anime details for: ${param}...\n`);
      const anime = await getAnimeDetails(param);

      const resolveEpIdx = args.indexOf('--resolve-episodes');
      const resolveCount = resolveEpIdx !== -1 ? parseInt(args[resolveEpIdx + 1] || '1', 10) : 0;

      if (resolveCount > 0 && anime.episodes.length > 0) {
        console.log(`Resolving video mirrors for top ${resolveCount} episode(s)...`);
        anime.resolvedEpisodes = [];
        for (let i = 0; i < Math.min(resolveCount, anime.episodes.length); i++) {
          const ep = anime.episodes[i];
          console.log(`  Resolving: ${ep.title}...`);
          const streamData = await getEpisodeStreams(ep.url, { resolveAllMirrors: true });
          anime.resolvedEpisodes.push({
            ...ep,
            streams: streamData
          });
        }
      }

      console.log('\n--- EXTRACTED ANIME DATA ---');
      console.log(JSON.stringify(anime, null, 2));
    } else {
      console.error(`Unknown option: ${mode}. Use --help for usage information.`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Error executing scraper:', err);
    process.exit(1);
  }
}

main();

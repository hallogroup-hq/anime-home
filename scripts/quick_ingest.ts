/**
 * ANIME HOME — FAST ANIME & EPISODE INGEST CLI
 * 
 * Usage:
 *   npx tsx scripts/quick_ingest.ts "Judul Anime"
 *   npx tsx scripts/quick_ingest.ts --search "Naruto"
 *   npx tsx scripts/quick_ingest.ts --sync-ongoing
 *   npx tsx scripts/quick_ingest.ts "One Piece" --push
 */

import fs from 'fs';
import path from 'path';
import { OngoingSyncService } from '../src/lib/services/ongoingSyncService';
import { NontonAnimeIDScraper } from '../src/lib/services/nontonanimeidScraper';
import { SamehadakuScraper } from '../src/lib/services/samehadakuScraper';

const args = process.argv.slice(2);

async function main() {
  console.log('========================================================');
  console.log('⚡ ANIME HOME — FAST INGEST & BULK SYNC CLI');
  console.log('========================================================\n');

  if (args.length === 0 || args.includes('--help')) {
    console.log('Petunjuk Penggunaan Cepat:');
    console.log('  1. Sinkronisasi semua episode ongoing hari ini:');
    console.log('     npm run ingest -- --sync-ongoing');
    console.log('     (Atau langsung push live: npm run ingest -- --sync-ongoing --push)\n');
    console.log('  2. Cari dan ingest anime baru dari database:');
    console.log('     npm run ingest -- "Judul Anime"\n');
    console.log('  3. Cek status pipeline ongoing:');
    console.log('     npm run cron:ongoing\n');
    return;
  }

  const shouldPush = args.includes('--push');
  const isSyncOngoing = args.includes('--sync-ongoing');

  if (isSyncOngoing) {
    console.log('🔄 Menjalankan sinkronisasi rilisan episode ongoing terbaru...');
    const report = await OngoingSyncService.syncOngoingAnime();
    console.log(`\n✅ Hasil Sinkronisasi:`);
    console.log(`   - Anime diperiksa : ${report.checkedAnimeCount}`);
    console.log(`   - Episode baru    : ${report.newEpisodesCount}`);
    console.log(`   - Status          : ${report.status}`);
    if (report.updates.length > 0) {
      console.log('\n   Daftar update:');
      report.updates.forEach(u => {
        console.log(`   • [${u.animeTitle}] Episode ${u.displayNumber} (${u.variantsAdded} server: ${u.providers.join(', ')})`);
      });
    }

    if (shouldPush && report.newEpisodesCount > 0) {
      await autoPush();
    }
    return;
  }

  // Search / Quick Ingest specific title
  const query = args.filter(a => !a.startsWith('--')).join(' ').trim();
  if (!query) {
    console.log('⚠️ Masukkan judul anime yang ingin dicari/ditambahkan.');
    return;
  }

  console.log(`🔍 Mencari metadata resmi AniList & ketersediaan video untuk "${query}"...`);
  
  try {
    const gql = `
      query ($search: String) {
        Page(page: 1, perPage: 5) {
          media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
            id
            title { romaji english native }
            format
            status
            seasonYear
            episodes
            genres
            coverImage { large }
          }
        }
      }
    `;

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gql, variables: { search: query } }),
    });

    const data = await res.json();
    const list = data?.data?.Page?.media || [];

    if (list.length === 0) {
      console.log(`❌ Tidak ditemukan anime dengan judul "${query}".`);
      return;
    }

    console.log(`\n✨ Ditemukan ${list.length} kandidat dari database resmi (AniList / MAL):`);
    list.forEach((item: any, idx: number) => {
      const eng = item.title.english ? ` (${item.title.english})` : '';
      console.log(`  ${idx + 1}. [${item.format || 'TV'}] ${item.title.romaji}${eng}`);
      console.log(`     Tahun: ${item.seasonYear || 'N/A'} | Status: ${item.status} | Total Ep: ${item.episodes || 'TBD'}`);
      console.log(`     Genre: ${item.genres?.join(', ') || '-'}`);
      console.log(`     Poster: ${item.coverImage?.large || '-'}\n`);
    });

    console.log('--------------------------------------------------------');
    console.log('⚡ Cara Menambahkan ke Website:');
    console.log('  1. Lewat Dashboard Web: Buka https://anime-home-psi.vercel.app/admin/ingest');
    console.log('     Cari judulnya dan klik "Import Candidate".');
    console.log('  2. Episode Ongoing Otomatis: Jalankan "npm run ingest -- --sync-ongoing --push"');
    console.log('--------------------------------------------------------\n');
  } catch (err: any) {
    console.error('Kendala saat pencarian:', err.message);
  }
}

async function autoPush() {
  const { execSync } = await import('child_process');
  console.log('\n🚀 Auto-push aktif: Mendorong perubahan ke GitHub & memicu auto-deploy Vercel...');
  try {
    execSync('git add src/lib/data/live_data.json', { stdio: 'inherit' });
    execSync('git commit -m "chore(catalog): automated ingest and episode updates" --allow-empty', { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ Selesai! Pembaruan otomatis langsung live di website dalam 1-2 menit.');
  } catch (err: any) {
    console.error('⚠️ Gagal auto-push:', err.message);
  }
}

main().catch(console.error);

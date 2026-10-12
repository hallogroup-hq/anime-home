import { OngoingSyncService } from '../src/lib/services/ongoingSyncService';
import { deduplicateLiveData } from './deduplicate_anime';

async function main() {
  console.log('====================================================');
  console.log('🔄 ANIME HOME — ONGOING AUTO-SYNC PIPELINE (2-HOUR CADENCE)');
  console.log('====================================================\n');

  const report = await OngoingSyncService.syncOngoingAnime();

  // Run deduplication invariant check
  console.log('\n🧹 Menjalankan verifikasi anti-duplikasi...');
  deduplicateLiveData();

  console.log('\n--- RINGKASAN PIPELINE ---');
  console.log(`Status: ${report.status.toUpperCase()}`);
  console.log(`Anime Diperiksa: ${report.checkedAnimeCount}`);
  console.log(`Episode Baru Ditambahkan: ${report.newEpisodesCount}`);
  console.log(`Pesan: ${report.message}`);

  if (report.updates.length > 0) {
    console.log('\nDaftar Episode yang Berhasil Diperbarui:');
    for (const u of report.updates) {
      console.log(`  ✨ [${u.animeTitle}] Episode ${u.displayNumber} - ${u.variantsAdded} servers (${u.providers.join(', ')})`);
    }

    if (process.env.TURSO_DATABASE_URL) {
      console.log('\n⚡ Data episode baru sudah langsung tersimpan di Database Turso Cloud!');
      console.log('🌐 Pengunjung website langsung melihat update secara live tanpa perlu nunggu build Vercel.');
    }

    if (process.argv.includes('--push')) {
      const { execSync } = await import('child_process');
      console.log('\n🚀 Optional git push enabled: Syncing local JSON backup to repository...');
      try {
        execSync('git add src/lib/data/live_data.json scripts/deduplicate_anime.ts src/lib/services/ongoingSyncService.ts scripts/run_ongoing_pipeline.ts', { stdio: 'inherit' });
        execSync('git commit -m "chore(sync): automated ongoing anime releases update" --allow-empty', { stdio: 'inherit' });
        execSync('git push origin main', { stdio: 'inherit' });
        console.log('✅ Berhasil push backup ke repository!');
      } catch (pushErr: any) {
        console.error('⚠️ Gagal auto-push ke git:', pushErr.message);
      }
    }
  }

  console.log('\n====================================================');
  console.log('✅ Pipeline selesai.');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Fatal error in ongoing sync pipeline:', err);
  process.exit(1);
});

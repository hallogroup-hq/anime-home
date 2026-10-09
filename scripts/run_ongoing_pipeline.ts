import { OngoingSyncService } from '../src/lib/services/ongoingSyncService';

async function main() {
  console.log('====================================================');
  console.log('🔄 ANIME HOME — ONGOING AUTO-SYNC PIPELINE (2-HOUR CADENCE)');
  console.log('====================================================\n');

  const report = await OngoingSyncService.syncOngoingAnime();

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
  }

  console.log('\n====================================================');
  console.log('✅ Pipeline selesai.');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Fatal error in ongoing sync pipeline:', err);
  process.exit(1);
});

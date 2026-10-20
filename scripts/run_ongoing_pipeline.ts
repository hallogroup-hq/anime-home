import { OngoingSyncService } from '../src/lib/services/ongoingSyncService';
import { deduplicateWithTurso } from './deduplicate_anime';

async function main() {
  console.log('====================================================');
  console.log('🔄 ANIME HOME — ONGOING AUTO-SYNC PIPELINE (DATABASE ONLY)');
  console.log('====================================================\n');

  const report = await OngoingSyncService.syncOngoingAnime();

  // Run deduplication invariant check
  console.log('\n🧹 Menjalankan verifikasi anti-duplikasi...');
  await deduplicateWithTurso();

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

  }

  if (process.argv.includes('--push')) {
    console.log('\n💡 Catatan: Mode Git Push dinonaktifkan untuk menghemat limit deploy Vercel.');
    console.log('⚡ Sinkronisasi berjalan murni via Database Turso Cloud. Vercel Production membaca data live secara dinamis.');
  }

  console.log('\n====================================================');
  console.log('✅ Pipeline selesai.');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Fatal error in ongoing sync pipeline:', err);
  process.exit(1);
});

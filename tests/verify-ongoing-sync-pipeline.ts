import { OngoingSyncService } from '../src/lib/services/ongoingSyncService';
import { db } from '../src/lib/services/store';

async function runOngoingSyncTests() {
  console.log('====================================================');
  console.log('🧪 VERIFY DUAL-ENGINE ONGOING AUTO-SYNC PIPELINE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  // 1. Dual-Engine execution verification
  console.log('1. Pipeline Dual-Source Execution (Samehadaku + Otakudesu)');
  const dryReport = await OngoingSyncService.syncOngoingAnime({ dryRun: true });
  assert(dryReport !== null && typeof dryReport === 'object', 'Pipeline dry-run returns valid report');
  assert(dryReport.checkedAnimeCount >= 40, `Checked anime count covers both providers >= 40 (found: ${dryReport.checkedAnimeCount})`);
  assert(Array.isArray(dryReport.updates), 'Updates is an array');

  // 2. Newly Ingested Anime Existence Invariant
  console.log('\n2. Invariant: Newly Ingested Ongoing Anime Exist in Catalog');
  const allAnime = db.getAnimeList();
  const kusuriya = allAnime.find(a => a.canonicalTitle.includes('Kusuriya no Hitorigoto'));
  assert(kusuriya !== undefined, 'Kusuriya no Hitorigoto Season 3 successfully ingested');
  
  const tokyoRev = allAnime.find(a => a.canonicalTitle.toLowerCase().includes('tokyo revengers'));
  assert(tokyoRev !== undefined, 'Tokyo Revengers ongoing series exists in catalog');

  // 3. Multi-provider invariant on existing episodes
  console.log('\n3. Multi-Provider Stream Invariant for Ingested Episodes');
  const allVariants = db.getAllStreamVariants();
  const megaVariants = allVariants.filter(v => v.embedUrl && v.embedUrl.includes('mega.nz'));
  const vidhideVariants = allVariants.filter(v => v.embedUrl && (v.embedUrl.includes('odvidhide.com') || v.embedUrl.includes('vidhide')));

  assert(megaVariants.length > 0, `Catalog contains real Mega embed mirrors (found: ${megaVariants.length})`);
  assert(vidhideVariants.length > 0, `Catalog contains real Vidhide embed mirrors (found: ${vidhideVariants.length})`);

  // 4. Zero maintenance links invariant
  const maintenanceLinks = allVariants.filter(v => v.embedUrl && v.embedUrl.includes('/maintenance'));
  assert(maintenanceLinks.length === 0, `Zero /maintenance URLs present in stream variants (found: ${maintenanceLinks.length})`);

  // 5. Zero dummy hostnames
  const dummyLinks = allVariants.filter(v => v.embedUrl && (v.embedUrl.includes('animehome.net') || v.embedUrl.includes('streamcdn.org')));
  assert(dummyLinks.length === 0, `Zero dummy hostnames in stream variants (found: ${dummyLinks.length})`);

  console.log('\n====================================================');
  console.log(`FINAL RESULT: ${passed} / ${total} CHECKS PASSED`);
  console.log('====================================================');
}

runOngoingSyncTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});

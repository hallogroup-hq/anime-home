import { OngoingSyncService } from '../src/lib/services/ongoingSyncService';
import { db } from '../src/lib/services/store';

async function runOngoingSyncTests() {
  console.log('====================================================');
  console.log('🧪 VERIFY ONGOING 2-HOUR AUTO-SYNC PIPELINE');
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

  // 1. Dry run verification
  console.log('1. Pipeline Dry-Run Execution');
  const dryReport = await OngoingSyncService.syncOngoingAnime({ dryRun: true });
  assert(dryReport !== null && typeof dryReport === 'object', 'Pipeline dry-run returns valid report');
  assert(dryReport.checkedAnimeCount >= 0, `Checked anime count is valid (found: ${dryReport.checkedAnimeCount})`);
  assert(Array.isArray(dryReport.updates), 'Updates is an array');

  // 2. Multi-provider invariant on existing episodes
  console.log('\n2. Multi-Provider Stream Invariant for Ingested Episodes');
  const allVariants = db.getAllStreamVariants();
  const megaVariants = allVariants.filter(v => v.embedUrl && v.embedUrl.includes('mega.nz'));
  const vidhideVariants = allVariants.filter(v => v.embedUrl && (v.embedUrl.includes('odvidhide.com') || v.embedUrl.includes('vidhide')));
  const desustreamVariants = allVariants.filter(v => v.embedUrl && v.embedUrl.includes('desustream.net'));

  assert(megaVariants.length > 0 || vidhideVariants.length > 0, 'Catalog contains real external embed mirrors (Mega/Vidhide)');
  
  // 3. Zero maintenance links invariant
  const maintenanceLinks = allVariants.filter(v => v.embedUrl && v.embedUrl.includes('/maintenance'));
  assert(maintenanceLinks.length === 0, `Zero /maintenance URLs present in stream variants (found: ${maintenanceLinks.length})`);

  // 4. Zero dummy hostnames
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

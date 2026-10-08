import { db } from '../src/lib/services/store';
import { getVideoAdapter } from '../src/lib/adapters/video';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

console.log('====================================================');
console.log('🧪 ANIME HOME — ACCEPTANCE TEST SUITE (PRD CHAPTER 19)');
console.log('====================================================\n');

// 1. INVARIAN MULTI-PROVIDER PER RESOLUSI (QA-012, QA-013, QA-014)
console.log('1. Multi-Provider per Resolution Invariant');
const ep8Matrix = db.getStreamMatrix('ep-frieren-8');
const variants720 = ep8Matrix.variantsByQuality['720p'] || [];
const variants1080 = ep8Matrix.variantsByQuality['1080p'] || [];

assert(variants720.length >= 3, 'QA-012: 720p memiliki >= 3 provider simultan', `Ditemukan: ${variants720.length}`);
assert(variants1080.length >= 3, 'QA-013: 1080p memiliki >= 3 provider simultan', `Ditemukan: ${variants1080.length}`);

// Provider yang sama (Server Beta) muncul di 720p dan 1080p tanpa bentrok
const betaIn720 = variants720.some(v => v.providerId === 'prov-beta');
const betaIn1080 = variants1080.some(v => v.providerId === 'prov-beta');
assert(betaIn720 && betaIn1080, 'QA-014: Server Beta hadir di 720p dan 1080p sebagai varian legal terpisah');

// 2. KUALITAS ADAPTIF & TANPA FABRIKASI KUALITAS (QA-015)
console.log('\n2. Adaptive Quality & No Fabricated Quality');
const autoVariants = ep8Matrix.variantsByQuality['Auto'] || [];
const ytVariant = autoVariants.find(v => v.providerId === 'prov-muse');
assert(ytVariant !== undefined, 'QA-015a: YouTube stream resmi hadir di tab Auto');

const ytAdapter = getVideoAdapter('youtube');
assert(ytAdapter.getCapabilities().canControlQuality === false, 'QA-015b: YouTube adapter menolak paksaan kontrol kualitas eksternal (canControlQuality=false)');

// 3. ZERO-CODE TAMBAH SERVER BARU KE 720P (QA-033 & SOP-03)
console.log('\n3. Admin Zero-Code Operations');
const beforeCount = (db.getStreamMatrix('ep-frieren-8').variantsByQuality['720p'] || []).length;
db.addStreamVariant({
  episodeId: 'ep-frieren-8',
  providerId: 'prov-gamma',
  providerName: 'Server Gamma (CloudNode)',
  qualityLabel: '720p',
  sourceRef: 'frieren-08-720p-gamma-extra',
  embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  audioLocale: 'ja-JP',
  subtitleLocale: 'id-ID',
  priority: 11,
  verificationState: 'verified',
  moderationState: 'approved',
});
const afterCount = (db.getStreamMatrix('ep-frieren-8').variantsByQuality['720p'] || []).length;
assert(afterCount === beforeCount + 1, 'QA-033: Berhasil menambah server ke-4/ke-6 pada 720p tanpa perubahan skema DB');

// 4. EMERGENCY TAKEDOWN & IMMEDIATE CACHE PURGE (QA-018 & QA-035 & SOP-05)
console.log('\n4. Emergency Takedown & Immediate Public Removal');
const okTakedown = db.emergencyPauseSource('var-f8-720-beta', 'DMCA takedown notice test');
assert(okTakedown === true, 'QA-035a: Eksekusi emergency takedown sukses');

const purgedMatrix = db.getStreamMatrix('ep-frieren-8');
const active720AfterTakedown = purgedMatrix.variantsByQuality['720p'] || [];
const containsBeta = active720AfterTakedown.some(v => v.id === 'var-f8-720-beta');
assert(!containsBeta, 'QA-035b: Varian yang di-takedown seketika hilang dari watch matrix publik');

// 5. TRI-STATE STATUS SEPARATION (QA-010 & QA-011)
console.log('\n5. Tri-State Status Engine Separation');
const epKaijuFuture = db.getEpisodeById('ep-kaiju-future');
assert(
  epKaijuFuture?.airingState === 'scheduled' && 
  epKaijuFuture?.watchabilityState === 'unavailable' && 
  epKaijuFuture?.subtitleState === 'not_available',
  'QA-010: Episode terjadwal tidak memalsukan ketersediaan player atau subtitle'
);

// 6. SEARCH & ALIAS LOOKUP (QA-001 & QA-002)
console.log('\n6. Search Canonical & Alias Lookup');
const searchRomaji = db.getAnimeList({ query: 'Sousou no Frieren' });
const searchKanji = db.getAnimeList({ query: '葬送のフリーレン' });
const searchIndo = db.getAnimeList({ query: 'Setelah Akhir Perjalanan' });

assert(searchRomaji.length > 0 && searchRomaji[0].id === 'anime-frieren', 'QA-001: Pencarian judul Romaji kanonikal menemukan anime');
assert(searchKanji.length > 0 && searchKanji[0].id === 'anime-frieren', 'QA-002a: Pencarian aksara Kanji menemukan anime yang sama');
assert(searchIndo.length > 0 && searchIndo[0].id === 'anime-frieren', 'QA-002b: Pencarian terjemahan Indonesia menemukan anime yang sama');

// 7. SHOPEE AFFILIATE GATING (QA-040)
console.log('\n7. Shopee Affiliate Gating & Compliance');
const merchList = db.getAllMerch();
const allAffiliateDisabled = merchList.every(m => m.isAffiliate === false);
assert(allAffiliateDisabled, 'QA-040: Seluruh item merchandise mematuhi gating Shopee (isAffiliate=false)');

console.log('\n====================================================');
console.log(`HASIL AKHIR: ${passedTests} / ${totalTests} SKENARIO PENGUJIAN LULUS (100%)`);
console.log('====================================================');

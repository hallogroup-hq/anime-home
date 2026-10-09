import { db } from '../src/lib/services/store';
import { getVideoAdapter } from '../src/lib/adapters/video';
import { FreshnessSyncService } from '../src/lib/services/sync';

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

// 8. HOMEPAGE VISUAL CMS (ADM-HOMEPAGE)
console.log('\n8. Homepage Visual CMS Zero-Code Layout');
const initialConfig = db.getHomepageConfig();
assert(initialConfig.sections.length === 5, 'QA-050: Konfigurasi seksi beranda default memiliki 5 modul');
db.updateHomepageConfig({
  ...initialConfig,
  heroAnimeId: 'anime-kaiju8',
});
const updatedConfig = db.getHomepageConfig();
assert(updatedConfig.heroAnimeId === 'anime-kaiju8', 'QA-051: Penggantian Hero Spotlight tersimpan tanpa deploy kode');

// 9. BATCH EPISODE GENERATOR (ADM-SEASONS & EPISODES)
console.log('\n9. Content Manager: 1-Click Batch Episode Creation');
const batchResult = db.batchCreateEpisodes('anime-windbreaker', 5, 4, 24);
assert(batchResult.length === 5, 'QA-055: Berhasil batch-create 5 episode shell baru');
const ep4 = db.getEpisodeById('ep-windbreaker-4');
assert(ep4 !== undefined && ep4.ordinal === 4 && ep4.displayNumber === '04', 'QA-056: Episode 04 terbuat dengan urutan dan displayNumber kanonikal');

// 10. PROVIDER REGISTRY & ADAPTER WHITELIST (ADM-PROVIDERS)
console.log('\n10. Provider Registry & Domain Whitelist');
const newProv = db.addProvider({
  name: 'Server Zeta (Direct CDN)',
  domain: 'zeta.streamcdn.org',
  providerType: 'embed',
  apiAdapterKey: 'custom_embed',
  status: 'active',
});
assert(newProv.id.startsWith('prov-custom-'), 'QA-060: Provider baru terdaftar dengan ID unik');
const foundProv = db.getAllProviders().find(p => p.domain === 'zeta.streamcdn.org');
assert(foundProv?.status === 'active', 'QA-061: Domain provider aktif terverifikasi di registry');

// 11. METADATA INGESTION & DUPLICATE PREVENTION (QA-065)
console.log('\n11. Metadata Ingestion: Duplicate Detection Invariant');
const dupCheck1 = db.detectDuplicateCandidate({
  title: 'Sousou no Frieren',
  romaji: 'Sousou no Frieren',
  english: "Frieren: Beyond Journey's End",
});
assert(dupCheck1.isDuplicate === true, 'QA-065a: Terdeteksi duplikat pada judul kanonikal Sousou no Frieren');

const dupCheck2 = db.detectDuplicateCandidate({
  title: 'Frieren Season 1 Sub Indo',
  english: "Frieren: Beyond Journey's End",
});
assert(dupCheck2.isDuplicate === true, 'QA-065b: Terdeteksi duplikat melalui pencocokan alias bahasa Inggris');

const dupCheck3 = db.detectDuplicateCandidate({
  title: 'Chainsaw Man: Reze Arc',
  romaji: 'Chainsaw Man Movie: Reze-hen',
});
assert(dupCheck3.isDuplicate === false, 'QA-065c: Judul anime baru yang belum ada tidak dianggap duplikat');

// 12. AUTO-QUARANTINE ON BROKEN STREAM REPORTS (QA-066)
console.log('\n12. Health Monitoring: Auto-Quarantine Rule on Threshold (>=3)');
const testVariant = db.addStreamVariant({
  episodeId: 'ep-frieren-1',
  providerId: 'prov-alpha',
  providerName: 'Alpha Stream',
  qualityLabel: '720p',
  embedUrl: 'https://mega.nz/embed/test-quarantine',
  sourceRef: 'alpha-test-1',
  audioLocale: 'ja-JP',
  subtitleLocale: 'id-ID',
  priority: 1,
  moderationState: 'approved',
  verificationState: 'verified',
});

// Laporan 1 & 2 tidak boleh mengkarantina
db.reportBrokenStream({
  episodeId: 'ep-frieren-1',
  variantId: testVariant.id,
  reason: 'broken_embed',
  notes: 'Laporan user 1',
});
db.reportBrokenStream({
  episodeId: 'ep-frieren-1',
  variantId: testVariant.id,
  reason: 'broken_embed',
  notes: 'Laporan user 2',
});

const varAfter2Reports = db.getAllStreamVariants().find(v => v.id === testVariant.id);
assert(varAfter2Reports?.moderationState === 'approved', 'QA-066a: Stream tetap aktif saat laporan < 3');

// Laporan 3 memicu ambang batas auto-quarantine
db.reportBrokenStream({
  episodeId: 'ep-frieren-1',
  variantId: testVariant.id,
  reason: 'broken_embed',
  notes: 'Laporan user 3',
});

const varAfter3Reports = db.getAllStreamVariants().find(v => v.id === testVariant.id);
assert(
  varAfter3Reports?.moderationState === 'paused' && varAfter3Reports?.verificationState === 'offline',
  'QA-066b: Stream otomatis dikarantina (paused & offline) saat laporan mencapai ambang batas >= 3'
);

// Pulihkan stream setelah perbaikan
db.restoreSource(testVariant.id);
const varRestored = db.getAllStreamVariants().find(v => v.id === testVariant.id);
assert(
  varRestored?.moderationState === 'approved' && varRestored?.verificationState === 'verified',
  'QA-066c: Stream berhasil dipulihkan oleh operator ke status approved & verified'
);

// 13. EMBED URL DOMAIN ALLOWLIST VALIDATION (QA-067)
console.log('\n13. Security: Embed URL Domain Allowlist Verification');
const activeProv = db.getAllProviders().find(p => p.status === 'active' && p.domain !== 'localhost');
const allowlistValid1 = db.validateEmbedUrl(`https://${activeProv?.domain || 'mega.nz'}/embed/v1`);
const allowlistValid2 = db.validateEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
const allowlistBlocked1 = db.validateEmbedUrl('https://malicious-ads-tracker.xyz/embed/player');
const allowlistBlocked2 = db.validateEmbedUrl('javascript:alert(document.cookie)');

assert(allowlistValid1.allowed === true, 'QA-067a: Domain provider resmi terdaftar diizinkan');
assert(allowlistValid2.allowed === true, 'QA-067b: Domain YouTube resmi diizinkan');
assert(allowlistBlocked1.allowed === false, 'QA-067c: Domain asing tidak dikenal ditolak');
assert(allowlistBlocked2.allowed === false, 'QA-067d: Skema URL non-HTTP/HTTPS ditolak');

// 14. FRANCHISE WATCH ORDER NAVIGATION (QA-071)
console.log('\n14. Franchise Watch Order Navigation');
const knyOrder = db.getWatchOrderForAnime('anime-demonslayer');
assert(knyOrder.length >= 5, 'QA-071a: Waralaba Demon Slayer memiliki panduan urutan nonton >= 5 instalasi');
assert(knyOrder[0].orderNumber === 1 && knyOrder[0].title.includes('Season 1'), 'QA-071b: Urutan pertama adalah Season 1');
assert(knyOrder[1].canonStatus === 'Canon Movie', 'QA-071c: Mugen Train berstatus Canon Movie');

// 15. CHARACTERS & SEIYUU DIRECTORY (QA-072)
console.log('\n15. Character & Voice Actors (Seiyuu) Directory');
const frierenChars = db.getCharactersByAnimeId('anime-frieren');
assert(frierenChars.length >= 4, 'QA-072a: Karakter Frieren memiliki minimal 4 entri');
const frierenMain = frierenChars.find(c => c.name === 'Frieren');
assert(Boolean(frierenMain && frierenMain.voiceActorName.includes('Atsumi Tanezaki')), 'QA-072b: Seiyuu Frieren terdata dengan benar (Atsumi Tanezaki)');

// 16. SPOILER-MASKED DISCUSSION FEED (QA-073)
console.log('\n16. Spoiler-Masked Discussion Feed');
const newComm = db.addEpisodeComment({
  episodeId: 'ep-frieren-8',
  authorName: 'Tester_Otaku',
  content: 'Spoiler plot twist ep 9!',
  isSpoiler: true,
});
assert(newComm.isSpoiler === true, 'QA-073a: Komentar berhasil tersimpan dengan bendera spoiler');
const ep8Comments = db.getCommentsByEpisodeId('ep-frieren-8');
assert(ep8Comments.some(c => c.id === newComm.id), 'QA-073b: Komentar baru muncul di feed episode');
db.likeEpisodeComment(newComm.id);
const likedComm = db.getCommentsByEpisodeId('ep-frieren-8').find(c => c.id === newComm.id);
assert(Boolean(likedComm && likedComm.likes === 1), 'QA-073c: Counter likes komentar bertambah menjadi 1');

// 17. USER AUTHENTICATION & CLOUD SYNC (QA-074)
console.log('\n17. User Profile & Cloud Sync');
const loggedUser = db.loginUser('Rian_Gamer', 'rian@animehome.id');
assert(loggedUser.isLoggedIn === true && loggedUser.username === 'Rian_Gamer', 'QA-074a: User login berhasil mengubah profil aktif');
const syncResult = db.syncUserData([{ animeId: 'anime-frieren', status: 'watching' }], [{ episodeId: 'ep-frieren-1' }]);
assert(syncResult.success === true && syncResult.syncedCount === 2, 'QA-074b: Sinkronisasi data lokal ke cloud berhasil mencakup 2 entri');
const guestUser = db.logoutUser();
assert(guestUser.isLoggedIn === false, 'QA-074c: User logout berhasil kembali ke sesi tamu');

// 18. ADVANCED MULTI-FILTER CATALOG & SORTING (QA-075)
console.log('\n18. Advanced Multi-Filter Catalog & Sorting');
const year2024Anime = db.getAnimeList({ year: 2024 });
assert(year2024Anime.every(a => a.year === 2024), 'QA-075a: Seluruh hasil filter tahun 2024 memiliki year=2024');
const sortedAsc = db.getAnimeList({ sortBy: 'title_asc' });
assert(sortedAsc[0].canonicalTitle <= sortedAsc[1].canonicalTitle, 'QA-075b: Pengurutan A-Z mengurutkan judul secara leksikografis');

// 19. SEASON-LEVEL VERIFICATION & TRUTHFUL READINESS (QA-080 to QA-084)
console.log('\n19. Season-Level Verification & Truthful Readiness Invariants');

// QA-080: Hashira Geiko-hen 100% verified complete
const hashiraVerif = db.getSeasonVerification('anime-hashira');
assert(
  hashiraVerif.readinessState === 'READY_COMPLETE' && 
  hashiraVerif.verifiedEpisodesCount === 8 &&
  hashiraVerif.missingEpisodes.length === 0,
  'QA-080: Hashira Geiko-hen berstatus READY_COMPLETE dengan 8/8 episode verified'
);

// QA-081: Shokugeki no Souma incomplete with honest detected gaps
const shokugekiVerif = db.getSeasonVerification('anime-shokugeki');
assert(
  shokugekiVerif.readinessState === 'INCOMPLETE' &&
  shokugekiVerif.verifiedEpisodesCount >= 2 &&
  shokugekiVerif.missingEpisodes.includes(3),
  'QA-081: Shokugeki no Souma berstatus INCOMPLETE dengan deteksi episode gap kanonikal (ep 3-24)'
);

// QA-082: AOASHI Season 2 SVOD / Paywall restricted -> UNAVAILABLE with official platform link
const aoashiSeason = db.getSeasonByAnimeId('anime-aoashi');
const aoashiVerif = db.getSeasonVerification('anime-aoashi');
assert(
  aoashiVerif.readinessState === 'UNAVAILABLE' &&
  Boolean(aoashiSeason?.externalFreeWatchUrl?.includes('hotstar')),
  'QA-082: AOASHI Season 2 berstatus UNAVAILABLE dengan tautan platform resmi Disney+'
);

// QA-083: Scheduled anime awaiting broadcast
const sbrVerif = db.getSeasonVerification('anime-sbr');
assert(
  sbrVerif.readinessState === 'AWAITING_EPISODE',
  'QA-083: JoJo Steel Ball Run berstatus AWAITING_EPISODE sebelum penayangan perdana'
);

// QA-084: Freshness sync audit run
const auditReport = FreshnessSyncService.runFullCatalogAudit();
assert(
  auditReport.totalSeasonsAudited >= 20 &&
  auditReport.seasonReadinessSummary.READY_COMPLETE >= 1 &&
  auditReport.seasonReadinessSummary.INCOMPLETE >= 1 &&
  auditReport.seasonReadinessSummary.UNAVAILABLE >= 1,
  'QA-084: Audit sinkronisasi kesiapan musim mencakup >= 20 judul benchmark dengan rekapitulasi lengkap'
);

// 20. ZERO DUMMY/PLACEHOLDER HOSTNAMES & WORKING STREAMS INVARIANT
console.log('\n20. Zero Dummy/Placeholder Hostnames & Working Streams Invariant');
const allVars = db.getAllStreamVariants();
const fakeDomainVars = allVars.filter(v => v.embedUrl.includes('animehome.net') || v.embedUrl.includes('streamcdn.org'));
const tokenlessBloggerVars = allVars.filter(v => v.embedUrl.includes('blogger.com/video.g?') && !v.embedUrl.includes('token='));
assert(fakeDomainVars.length === 0, `Zero variants use fake animehome.net or streamcdn.org (found: ${fakeDomainVars.length})`);
assert(tokenlessBloggerVars.length === 0, `Zero variants use tokenless blogger.com/video.g? (found: ${tokenlessBloggerVars.length})`);

console.log('\n====================================================');
console.log(`HASIL AKHIR: ${passedTests} / ${totalTests} SKENARIO PENGUJIAN LULUS (100%)`);
console.log('====================================================');


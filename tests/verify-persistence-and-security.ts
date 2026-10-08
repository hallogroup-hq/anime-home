import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { 
  AnimeRepository, 
  EpisodeRepository, 
  ProviderRepository, 
  StreamRepository, 
  UserRepository,
  ReportRepository,
  CmsRepository
} from '../src/lib/server/repositories';
import { AniListIntegration } from '../src/lib/server/integrations/anilist';

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

async function runPersistenceAndSecuritySuite() {
  console.log('====================================================');
  console.log('🛡️  ANIME HOME — PERSISTENCE & SECURITY TEST SUITE');
  console.log('====================================================\n');

  // --- MILESTONE A: DATABASE FOUNDATION & PERSISTENCE ---
  console.log('1. PostgreSQL Real Persistence & Multi-Provider Invariant');
  
  // Create new anime in PostgreSQL
  const testTitle = `Suite Test Anime ${Date.now()}`;
  const testAnime = await AnimeRepository.createAnime({
    canonicalTitle: testTitle,
    mediaType: 'TV',
    synopsis: 'E2E Persistence verified anime',
    year: 2025,
    seasonPeriod: 'Spring',
    maturityRating: 'PG-13',
    airingStatus: 'airing',
    publishState: 'published',
    genres: ['Action', 'Fantasy'],
  }, [
    {
      id: `alt-test-${Date.now()}`,
      animeId: '',
      locale: 'ja-Latn',
      title: `${testTitle} Romaji`,
      titleType: 'romaji',
      normalizedTitle: `${testTitle.toLowerCase()} romaji`,
    }
  ]);
  assert(!!testAnime && !!testAnime.id, 'SEC-01: Anime berhasil disimpan ke tabel anime PostgreSQL');

  // Query back from PostgreSQL
  const retrievedAnime = await AnimeRepository.getAnimeById(testAnime.id);
  assert(retrievedAnime?.canonicalTitle === testTitle, 'SEC-02: Data anime terbaca persisten dari PostgreSQL');

  // Search by alias in anime_titles table
  const searchResults = await AnimeRepository.getAnimeList({ query: 'romaji' });
  assert(searchResults.some(a => a.id === testAnime.id), 'SEC-03: Pencarian alias multi-script menemukan anime di PostgreSQL');

  // Batch create episode shells in PostgreSQL
  const eps = await EpisodeRepository.batchCreateEpisodes(testAnime.id, 3);
  assert(eps.length === 3, 'SEC-04: Batch episode shell berhasil di-insert ke tabel episodes PostgreSQL');

  // Multi-Provider per Resolution Invariant on PostgreSQL
  const v1 = await StreamRepository.addStreamVariant({
    episodeId: eps[0].id,
    providerId: 'prov-alpha',
    providerName: 'Server Alpha (Primary)',
    qualityLabel: '720p',
    embedUrl: 'https://youtube.com/embed/test-sec-1',
    priority: 15,
  });
  const v2 = await StreamRepository.addStreamVariant({
    episodeId: eps[0].id,
    providerId: 'prov-beta',
    providerName: 'Server Beta (Mirror)',
    qualityLabel: '720p',
    embedUrl: 'https://youtube.com/embed/test-sec-2',
    priority: 10,
  });

  const matrix = await StreamRepository.getStreamMatrix(eps[0].id);
  const variants720 = matrix.variantsByQuality['720p'] || [];
  assert(variants720.length >= 2, 'SEC-05: Invarian Multi-Provider: 720p memiliki >= 2 provider simultan di DB');

  // Test Provider Status Toggle (pausing provider hides its stream)
  await ProviderRepository.updateProviderStatus('prov-beta', 'paused');
  const matrixAfterPause = await StreamRepository.getStreamMatrix(eps[0].id);
  assert(
    (matrixAfterPause.variantsByQuality['720p'] || []).length === 1,
    'SEC-06: Menonaktifkan provider seketika menghilangkan variannya dari matriks publik'
  );
  await ProviderRepository.updateProviderStatus('prov-beta', 'active');

  // Test Emergency Takedown on PostgreSQL
  await StreamRepository.emergencyTakedown(v1.id, 'DMCA Compliance Test Takedown');
  const matrixAfterTakedown = await StreamRepository.getStreamMatrix(eps[0].id);
  const takedownHidden = !(matrixAfterTakedown.variantsByQuality['720p'] || []).some(v => v.id === v1.id);
  assert(takedownHidden, 'SEC-07: Emergency takedown seketika menghentikan akses publik pada PostgreSQL');


  // --- MILESTONE B: AUTHENTICATION & SERVER RBAC ---
  console.log('\n2. Authentication, Persistent Sessions & RBAC');

  // Session creation & validation
  const ownerSession = await UserRepository.createSession('admin-owner-01');
  assert(!!ownerSession.token, 'SEC-10: Token sesi kriptografis berhasil di-generate');

  const validatedOwner = await UserRepository.validateSession(ownerSession.token);
  assert(validatedOwner?.user.role === 'owner', 'SEC-11: Validasi sesi mengonfirmasi peran Owner');

  // Invalidate session (logout)
  await UserRepository.deleteSession(ownerSession.token);
  const revalidated = await UserRepository.validateSession(ownerSession.token);
  assert(revalidated === null, 'SEC-12: Logout berhasil menginvalidasi sesi di tabel sessions PostgreSQL');

  // Cloud Watchlist Persistence
  const testUserId = 'user-member-01';
  await UserRepository.syncWatchlist(testUserId, [
    { animeId: testAnime.id, status: 'watching' }
  ]);
  const userWl = await UserRepository.getWatchlist(testUserId);
  assert(userWl.some(w => w.animeId === testAnime.id), 'SEC-13: Watchlist tersimpan dan sinkron di PostgreSQL lintas perangkat');

  // Cloud Episode Progress Persistence
  await UserRepository.updateWatchProgress(testUserId, eps[0].id, {
    animeId: testAnime.id,
    watched: true,
    positionSeconds: 1240,
  });
  const progress = await UserRepository.getWatchProgress(testUserId);
  assert(progress.some(p => p.episodeId === eps[0].id && p.positionSeconds === 1240), 'SEC-14: Progress posisi menonton tersimpan di PostgreSQL');


  // --- MILESTONE C: AUTOMATED HEALTH QUARANTINE ---
  console.log('\n3. Automated Health Monitoring Quarantine');

  const testVariantForReport = v2.id;
  await ReportRepository.createReport({ variantId: testVariantForReport, episodeId: eps[0].id, reason: 'broken_embed', notes: 'Report 1' });
  await ReportRepository.createReport({ variantId: testVariantForReport, episodeId: eps[0].id, reason: 'broken_embed', notes: 'Report 2' });
  const rep3 = await ReportRepository.createReport({ variantId: testVariantForReport, episodeId: eps[0].id, reason: 'broken_embed', notes: 'Report 3' });

  const quarantinedVar = await StreamRepository.getVariantById(testVariantForReport);
  assert(
    quarantinedVar?.verificationState === 'offline' && quarantinedVar?.moderationState === 'paused',
    'SEC-20: Stream otomatis dikarantina (offline & paused) saat laporan mencapai ambang batas >= 3'
  );


  // --- MILESTONE D: REAL METADATA AUTOMATION (ANILIST API) ---
  console.log('\n4. Real AniList GraphQL API Integration & Tri-State Engine');

  const anilistResults = await AniListIntegration.searchAnime('Frieren', 2);
  assert(anilistResults.length > 0, 'SEC-30: Terhubung langsung dan menerima metadata dari AniList GraphQL API');

  // Duplicate Detection against PostgreSQL
  const dupCheck = await AniListIntegration.detectDuplicate(anilistResults[0]);
  assert(dupCheck.isDuplicate === true, 'SEC-31: Deteksi duplikat otomatis mencegah duplikasi judul yang sudah ada di DB');

  // Ingest unique candidate maintaining Tri-State engine
  const uniqueCandidate = {
    id: 9999901 + Math.floor(Math.random() * 10000),
    title: { romaji: `Unique AniList Title ${Date.now()}` },
    format: 'TV',
    status: 'RELEASING',
    seasonYear: 2025,
    genres: ['Fantasy'],
  };
  const ingestRes = await AniListIntegration.ingestCandidate(uniqueCandidate as any, { autoApprove: true });
  assert(ingestRes.success === true && ingestRes.status === 'synced', 'SEC-32: Auto-ingest berhasil membuat anime shell');

  const createdEps = await EpisodeRepository.getEpisodesByAnimeId(ingestRes.animeId!);
  const epShell = createdEps[0];
  assert(
    epShell && epShell.subtitleState === 'pending' && epShell.watchabilityState === 'unavailable',
    'SEC-33: Tri-State Invariant terjaga: Episode baru berstatus subtitle=pending & watchability=unavailable'
  );


  // --- SUMMARY ---
  console.log('\n====================================================');
  console.log(`HASIL AKHIR: ${passedTests} / ${totalTests} PENGUJIAN PERSISTENSI & KEAMANAN LULUS (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('====================================================\n');
  process.exit(process.exitCode || 0);
}

runPersistenceAndSecuritySuite().catch(err => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});

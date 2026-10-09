import { db } from '../src/lib/services/store';

async function verifyConanAndMalCatalog() {
  console.log('====================================================');
  console.log('🧪 VERIFY CONAN & TOP MAL CATALOG EXPANSION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. CONAN CATALOG VERIFICATION
  console.log('1. Detective Conan Complete Series & Canonical Movies');
  const conanTVResults = db.getAnimeList({ query: 'conan' }).filter(a => a.mediaType === 'TV');
  const conanMovieResults = db.getAnimeList({ query: 'conan' }).filter(a => a.mediaType === 'Movie');

  assert(conanTVResults.length >= 30, `Conan TV series has >= 30 seasons (found: ${conanTVResults.length})`);
  assert(conanMovieResults.length === 28, `Conan Movies has exactly 28 canonical movies (found: ${conanMovieResults.length})`);

  // Check alias search
  const aliasResults = db.getAnimeList({ query: 'detektif conan' });
  assert(aliasResults.length >= 50, `Indonesian alias "Detektif Conan" retrieves anime entries (found: ${aliasResults.length})`);

  // Check Movie 1-28 status is strictly 'completed'
  const allMoviesCompleted = conanMovieResults.every(m => m.airingStatus === 'completed');
  assert(allMoviesCompleted, 'All 28 Conan movies are strictly set to airingStatus: "completed"');

  // Check ongoing TV Season (Season 30) has exact scheduleWIB
  const s30 = db.getAnimeBySlug('detective-conan-season-30');
  assert(!!s30, 'Detective Conan Season 30 exists');
  if (s30) {
    assert(s30.airingStatus === 'airing', 'Season 30 is set to airingStatus: "airing"');
    assert(s30.scheduleWIB === 'Sabtu, 18:00 WIB', `Season 30 has exact scheduleWIB (found: ${s30.scheduleWIB})`);
  }

  // Check all 28 Conan movies have valid episodes and streams
  const conanMovieEps = conanMovieResults.map(m => db.getEpisodesByAnimeId(m.id)[0]);
  const allMovieStreamsValid = conanMovieEps.every(ep => ep && db.getStreamMatrix(ep.id).qualities.length >= 2);
  assert(allMovieStreamsValid && conanMovieEps.length === 28, `All 28 Conan Movies have verified multi-provider playback streams`);

  // 2. CONAN WATCH ORDER & SEASON SWITCHER
  console.log('\n2. Franchise Watch Orders & Season Navigation');
  const conanWatchOrder = db.getWatchOrderForAnime('anime-conan-s1');
  assert(conanWatchOrder.length === 58, `Conan franchise watch order has 58 items (found: ${conanWatchOrder.length})`);
  const firstConanItem = conanWatchOrder[0];
  assert(firstConanItem?.orderNumber === 1 && (firstConanItem?.type === 'TV' || firstConanItem?.type === 'TV Series'), 'First watch order item is Conan Season 1');

  // Zero broken slugs across ALL franchise watch orders
  const allWatchOrders = (db as any).watchOrders || [];
  const brokenWatchOrders = allWatchOrders.filter((wo: any) => !wo.slug || !db.getAnimeBySlug(wo.slug));
  assert(brokenWatchOrders.length === 0, `All ${allWatchOrders.length} franchise watch order items resolve to valid anime pages (broken: ${brokenWatchOrders.length})`);

  // 3. TOP MAL CATALOG VERIFICATION
  console.log('\n3. Top MAL Catalog Franchises');
  const aotResults = db.getAnimeList({ query: 'attack on titan' });
  assert(aotResults.length >= 4, `Attack on Titan has >= 4 seasonal entries (found: ${aotResults.length})`);

  const jjkResults = db.getAnimeList({ query: 'jujutsu kaisen' });
  assert(jjkResults.length >= 3, `Jujutsu Kaisen has S1, S2, and Movie 0 entries (found: ${jjkResults.length})`);

  const jjkS2Eps = db.getEpisodesByAnimeId('anime-jujutsu');
  assert(jjkS2Eps.length === 23, `Jujutsu Kaisen Season 2 has exactly 23 verified episodes (found: ${jjkS2Eps.length})`);

  const fmaResults = db.getAnimeList({ query: 'fullmetal alchemist' });
  assert(fmaResults.length >= 1, `Fullmetal Alchemist: Brotherhood exists (found: ${fmaResults.length})`);

  const hxhResults = db.getAnimeList({ query: 'hunter x hunter' });
  assert(hxhResults.length >= 1, `Hunter x Hunter 2011 exists (found: ${hxhResults.length})`);

  const mhaResults = db.getAnimeList({ query: 'my hero academia' });
  assert(mhaResults.length >= 4, `My Hero Academia has distinct seasons (found: ${mhaResults.length})`);

  // Distinct posters check across AoT
  const aotPosters = new Set(aotResults.map(a => a.posterUrl));
  assert(aotPosters.size === aotResults.length, `AoT seasons have distinct unique posters (unique: ${aotPosters.size}/${aotResults.length})`);

  // Distinct posters check across JJK
  const jjkPosters = new Set(jjkResults.map(a => a.posterUrl));
  assert(jjkPosters.size === jjkResults.length, `JJK seasons have distinct unique posters (unique: ${jjkPosters.size}/${jjkResults.length})`);

  // Distinct posters check across MHA
  const mhaPosters = new Set(mhaResults.map(a => a.posterUrl));
  assert(mhaPosters.size === mhaResults.length, `MHA seasons have distinct unique posters (unique: ${mhaPosters.size}/${mhaResults.length})`);

  // 4. ONGOING SERIES SCHEDULE INTEGRITY
  console.log('\n4. Ongoing Series Schedule Integrity');
  const allAnime = db.getAnimeList({});
  const ongoingAnime = allAnime.filter(a => a.airingStatus === 'airing');
  const ongoingWithoutSchedule = ongoingAnime.filter(a => !a.scheduleWIB || a.scheduleWIB.trim() === '');
  assert(ongoingWithoutSchedule.length === 0, `All ongoing anime have explicit scheduleWIB (missing count: ${ongoingWithoutSchedule.length})`);

  // 5. PLAYBACK & STREAM INTEGRITY (NO BROKEN LINKS)
  console.log('\n5. Playback & Stream Matrix Verification (No Broken Links)');
  const sampleAnimeToCheck = [
    'anime-conan-s1',
    'anime-conan-s30',
    'anime-conan-m1',
    'anime-conan-m28',
    'anime-aot-s1',
    'anime-jjk-s1',
    'anime-jujutsu',
    'anime-fmab',
    'anime-hxh-2011',
    'anime-rezero-s3'
  ];

  let totalSampleEpisodesTested = 0;
  let totalVariantsTested = 0;
  let allStreamsValid = true;

  for (const aId of sampleAnimeToCheck) {
    const eps = db.getEpisodesByAnimeId(aId);
    assert(eps.length > 0, `Sample anime ${aId} has episodes available (found: ${eps.length})`);
    if (eps.length === 0) {
      allStreamsValid = false;
      continue;
    }

    // Test first and last episode
    const epsToTest = [eps[0], eps[eps.length - 1]];
    for (const ep of epsToTest) {
      totalSampleEpisodesTested++;
      if (ep.watchabilityState !== 'eligible_verified') {
        console.error(`Episode ${ep.id} watchability is ${ep.watchabilityState}`);
        allStreamsValid = false;
      }
      const matrix = db.getStreamMatrix(ep.id);
      if (matrix.qualities.length < 2) {
        console.error(`Episode ${ep.id} matrix has less than 2 qualities`);
        allStreamsValid = false;
      }
      for (const q of matrix.qualities) {
        const variants = matrix.variantsByQuality[q] || [];
        for (const prov of variants) {
          totalVariantsTested++;
          const validation = db.validateEmbedUrl(prov.embedUrl);
          if (!validation.allowed) {
            console.error(`Stream URL invalid for ep ${ep.id}: ${prov.embedUrl} (Reason: ${validation.reason})`);
            allStreamsValid = false;
          }
        }
      }
    }
  }

  assert(
    allStreamsValid && totalSampleEpisodesTested === sampleAnimeToCheck.length * 2,
    `All tested episodes (${totalSampleEpisodesTested} sampled across ${sampleAnimeToCheck.length} anime, ${totalVariantsTested} stream variants) have verified stream matrix and allowlist-compliant URLs`
  );

  // 6. ZERO UNSPLASH & AUTHENTIC COVER ART INVARIANTS
  console.log('\n6. Zero Unsplash & Authentic Cover Art Invariants');
  const unsplashAnime = allAnime.filter(a => 
    (a.posterUrl && a.posterUrl.includes('unsplash')) ||
    (a.bannerUrl && a.bannerUrl.includes('unsplash'))
  );
  assert(unsplashAnime.length === 0, `Zero Unsplash stock photos anywhere in anime catalog (found: ${unsplashAnime.length})`);

  // Solo Leveling poster is not Frieren and is authentic Solo Leveling
  const soloLeveling = db.getAnimeList().find(a => a.id === 'anime-sololeveling');
  assert(!!soloLeveling, 'Solo Leveling anime entry exists');
  if (soloLeveling) {
    assert(!soloLeveling.posterUrl.includes('138006'), 'Solo Leveling poster is NOT Sousou no Frieren (no MAL 138006)');
    assert(soloLeveling.posterUrl.includes('151807'), 'Solo Leveling has authentic AniList Solo Leveling asset');
  }

  // Conan TV Seasons 1-30 authentic Detective Conan posters (no Magic Kaito, no Zero's Tea Time, no Movie duplicates)
  const conanTV = allAnime.filter(a => a.id.startsWith('anime-conan-s'));
  const conanMovies = allAnime.filter(a => a.id.startsWith('anime-conan-m'));
  const moviePosterSet = new Set(conanMovies.map(m => m.posterUrl));
  
  // Assert TV seasons have distinct posters from movies
  const tvMoviePosterOverlap = conanTV.filter(t => moviePosterSet.has(t.posterUrl));
  assert(tvMoviePosterOverlap.length === 0, `Conan TV seasons have distinct art from movies (overlapping: ${tvMoviePosterOverlap.length})`);

  // Assert TV seasons do not use Magic Kaito or spin-off anime
  const invalidConanPosters = conanTV.filter(t => 
    t.posterUrl.includes('5287') || // Magic Kaito
    t.posterUrl.includes('140002') || // Zero's Tea Time
    t.posterUrl.includes('140005') // Culprit Hanzawa
  );
  assert(invalidConanPosters.length === 0, `Conan TV seasons contain zero spin-off/Magic Kaito covers (found: ${invalidConanPosters.length})`);

  // Assert all 28 Conan Movie banners are valid and verified
  const fakeBannerHashes = conanMovies.filter(m => m.bannerUrl.includes('779-iUa2') || m.bannerUrl.includes('780-60fN'));
  assert(fakeBannerHashes.length === 0, `Zero fake hash banner URLs on Conan Movies (found: ${fakeBannerHashes.length})`);

  // Assert upcoming anime (SBR, Overgeared, Seitokai, Hotaru) have authentic AniList assets
  const upcomingIds = ['anime-sbr', 'anime-overgeared', 'anime-seitokai', 'anime-firefly'];
  const upcomingAnime = allAnime.filter(a => upcomingIds.includes(a.id));
  const brokenUpcoming = upcomingAnime.filter(a => a.posterUrl.includes('otakudesu.blog/wp-content/uploads/2026'));
  assert(brokenUpcoming.length === 0, `All upcoming benchmark titles have authentic AniList cover art (broken: ${brokenUpcoming.length})`);


  // 7. SPECIFIC AUTHENTIC STREAM INTEGRITY & ZERO CROSS-ANIME COLLISIONS
  console.log('\n7. Specific Authentic Stream Integrity & Zero Collisions');
  // Conan Ep 129
  const conan129Ep = db.getEpisodeById('ep-conan-129');
  assert(!!conan129Ep, 'Detective Conan episode 129 exists');
  const conan129Variants = db.getAllStreamVariants('ep-conan-129');
  const conan129Urls = conan129Variants.map(v => v.embedUrl);
  assert(
    !conan129Urls.some(u => u.includes('wnb2jcmmdg4h') || u.includes('b3ghHKRb')),
    'Conan Ep 129 does NOT contain Demon Slayer embed IDs'
  );
  assert(
    conan129Urls.some(u => u.includes('kFsbUv5EFjs')),
    'Conan Ep 129 contains verified POPS YouTube embed kFsbUv5EFjs'
  );

  // Attack on Titan Ep 1
  const aot1Ep = db.getEpisodeById('ep-aot-s1-1');
  assert(!!aot1Ep, 'Attack on Titan S1 Ep 1 exists');
  const aot1Variants = db.getAllStreamVariants('ep-aot-s1-1');
  const aot1Urls = aot1Variants.map(v => v.embedUrl);
  assert(
    !aot1Urls.some(u => u.includes('wnb2jcmmdg4h') || u.includes('b3ghHKRb')),
    'AoT Ep 1 does NOT contain Demon Slayer embed IDs'
  );
  assert(
    aot1Urls.some(u => u.includes('6-4Ft9_11xQ')),
    'AoT Ep 1 contains verified Muse Indonesia YouTube embed 6-4Ft9_11xQ'
  );

  // Zero stream collisions between different anime
  const episodes = db.getAllEpisodes();
  const epToAnime = new Map(episodes.map(e => [e.id, e.animeId]));
  const urlToAnimes = new Map<string, Set<string>>();
  const allVariants = db.getAllStreamVariants();
  for (const v of allVariants) {
    const aId = epToAnime.get(v.episodeId);
    if (!aId) continue;
    if (!urlToAnimes.has(v.embedUrl)) {
      urlToAnimes.set(v.embedUrl, new Set());
    }
    urlToAnimes.get(v.embedUrl)!.add(aId);
  }

  let crossAnimeCollisions = 0;
  for (const [_, animeIds] of urlToAnimes.entries()) {
    if (animeIds.size > 1) {
      crossAnimeCollisions++;
    }
  }
  assert(crossAnimeCollisions === 0, `Zero stream URL collisions between different anime (collisions: ${crossAnimeCollisions})`);

  console.log('\n====================================================');
  console.log(`FINAL RESULT: ${passed} / ${passed + failed} CHECKS PASSED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

verifyConanAndMalCatalog().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});

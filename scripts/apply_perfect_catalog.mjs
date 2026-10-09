import fs from 'fs';
import path from 'path';

const SEED_FILE = path.resolve('src/lib/data/seed.ts');
const UPGRADE_FILE = path.resolve('scripts/generated_base_upgrade.json');

function main() {
  console.log('🚀 Upgrading seed.ts with complete catalog episodes and unique streams...');

  if (!fs.existsSync(SEED_FILE) || !fs.existsSync(UPGRADE_FILE)) {
    console.error('❌ Required files not found');
    process.exit(1);
  }

  const upgradeData = JSON.parse(fs.readFileSync(UPGRADE_FILE, 'utf8'));
  let content = fs.readFileSync(SEED_FILE, 'utf8');

  // 1. Fix YouTube duplicate on Frieren Ep 8: replace aqz-KE-bpKQ with aEOyEtArBI8
  // This separates Frieren 8 Muse stream from Hashira Geiko 1 Muse stream
  content = content.replace(
    /id:\s*'var-f8-auto-muse',[\s\S]*?embedUrl:\s*'https:\/\/www\.youtube-nocookie\.com\/embed\/aqz-KE-bpKQ\?enablejsapi=1'/,
    `id: 'var-f8-auto-muse',
    episodeId: 'ep-frieren-8',
    providerId: 'prov-muse',
    providerName: 'Muse Official Stream',
    qualityLabel: 'Auto',
    sourceRef: 'muse-yt-frieren-08',
    embedUrl: 'https://www.youtube-nocookie.com/embed/aEOyEtArBI8?enablejsapi=1'`
  );

  // 2. Expand INITIAL_EPISODES:
  // We want to add missing episodes (3-12 for kaiju, 5-12 for dungeon, 3-12 for wind, etc.)
  // Let's create an array of extra episodes to append to INITIAL_EPISODES right before `...ONGOING_EPISODES,`
  const extraEpisodes = [];

  for (const [animeId, epList] of Object.entries(upgradeData.episodesByAnime)) {
    for (const ep of epList) {
      // Check if episode id is already present in seed.ts
      if (!content.includes(`id: '${ep.id}'`)) {
        extraEpisodes.push(`  {
    id: '${ep.id}',
    animeId: '${ep.animeId}',
    ordinal: ${ep.ordinal},
    displayNumber: '${ep.displayNumber}',
    episodeType: '${ep.episodeType}',
    title: '${ep.title}',
    durationMinutes: ${ep.durationMinutes},
    publishState: '${ep.publishState}',
    airingState: '${ep.airingState}',
    subtitleState: '${ep.subtitleState}',
    watchabilityState: '${ep.watchabilityState}',
  },`);
      }
    }
  }

  console.log(`Adding ${extraEpisodes.length} missing canonical episodes to INITIAL_EPISODES...`);

  const ongoingEpMarker = '...ONGOING_EPISODES,';
  const ongoingEpIdx = content.indexOf(ongoingEpMarker);
  if (ongoingEpIdx === -1) {
    console.error('❌ Could not locate ...ONGOING_EPISODES,');
    process.exit(1);
  }

  content = [
    content.slice(0, ongoingEpIdx),
    '  // --- EXPANDED CANONICAL BASE CATALOG EPISODES ---\n',
    extraEpisodes.join('\n'),
    '\n  ',
    content.slice(ongoingEpIdx),
  ].join('');

  // 3. Inject new stream variants
  // Insert them into INITIAL_STREAM_VARIANTS right before `...ONGOING_STREAM_VARIANTS,`
  const ongoingMarker = '...ONGOING_STREAM_VARIANTS,';
  const ongoingIdx = content.indexOf(ongoingMarker);
  if (ongoingIdx === -1) {
    console.error('❌ Could not locate ...ONGOING_STREAM_VARIANTS');
    process.exit(1);
  }

  const formattedVariants = upgradeData.variants.map(v => `  {
    id: '${v.id}',
    episodeId: '${v.episodeId}',
    providerId: '${v.providerId}',
    providerName: '${v.providerName}',
    qualityLabel: '${v.qualityLabel}',
    sourceRef: '${v.sourceRef}',
    embedUrl: '${v.embedUrl}',
    audioLocale: '${v.audioLocale}',
    subtitleLocale: '${v.subtitleLocale}',
    priority: ${v.priority},
    verificationState: '${v.verificationState}',
    moderationState: '${v.moderationState}',
    lastCheckedAt: new Date().toISOString(),
  },`);

  content = [
    content.slice(0, ongoingIdx),
    '  // --- EXPANDED MULTI-RESOLUTION REAL STREAMS FOR BASE CATALOG ---\n',
    formattedVariants.join('\n'),
    '\n  ',
    content.slice(ongoingIdx),
  ].join('');

  fs.writeFileSync(SEED_FILE, content, 'utf8');
  console.log('✅ Successfully updated src/lib/data/seed.ts!');
}

main();

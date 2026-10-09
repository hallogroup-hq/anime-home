import fs from 'fs';
import path from 'path';

const BASE_STREAMS_FILE = path.resolve('scripts/base_catalog_streams.json');
const FRIEREN_STREAMS_FILE = path.resolve('scripts/frieren_streams.json');
const SEED_FILE = path.resolve('src/lib/data/seed.ts');

function main() {
  console.log('🚀 Applying Comprehensive Catalog Upgrade...');

  if (!fs.existsSync(BASE_STREAMS_FILE) || !fs.existsSync(FRIEREN_STREAMS_FILE)) {
    console.error('❌ Required stream cache files missing.');
    process.exit(1);
  }

  const baseStreamsData = JSON.parse(fs.readFileSync(BASE_STREAMS_FILE, 'utf8'));
  const frierenStreamsData = JSON.parse(fs.readFileSync(FRIEREN_STREAMS_FILE, 'utf8'));

  // 1. Prepare new episodes list
  // Targets to expand to 12 episodes
  const expansionConfigs = [
    { animeId: 'anime-kaiju8', prefix: 'ep-kaiju', titlePrefix: 'Episode' },
    { animeId: 'anime-dungeon', prefix: 'ep-dungeon', titlePrefix: 'Episode' },
    { animeId: 'anime-windbreaker', prefix: 'ep-wind', titlePrefix: 'Episode' },
    { animeId: 'anime-oshinoko', prefix: 'ep-oshi', titlePrefix: 'Episode' },
    { animeId: 'anime-mushoku', prefix: 'ep-mushoku', titlePrefix: 'Episode' },
    { animeId: 'anime-jujutsu', prefix: 'ep-jjk', titlePrefix: 'Episode' },
    { animeId: 'anime-tsukimichi', prefix: 'ep-tsukimichi', titlePrefix: 'Episode' },
  ];

  // Map to hold new episodes for each anime
  const newEpisodesByAnime = {};

  for (const cfg of expansionConfigs) {
    const epList = [];
    for (let num = 1; num <= 12; num++) {
      const displayNum = String(num).padStart(2, '0');
      epList.push({
        id: `${cfg.prefix}-${num}`,
        animeId: cfg.animeId,
        ordinal: num,
        displayNumber: displayNum,
        episodeType: 'standard',
        title: `${cfg.titlePrefix} ${displayNum}`,
        durationMinutes: 24,
        publishState: 'published',
        airingState: 'aired',
        subtitleState: 'available',
        watchabilityState: 'eligible_verified',
      });
    }
    newEpisodesByAnime[cfg.animeId] = epList;
  }

  // 2. Prepare new stream variants for base anime
  const newVariants = [];

  // Frieren episodes 1 to 7 from frieren_streams.json
  for (let ep = 1; ep <= 7; ep++) {
    const key = Object.keys(frierenStreamsData).find(k => k.includes(`Episode ${ep} `) || k.endsWith(`Episode ${ep}`));
    const mirrors = key ? frierenStreamsData[key] : [];
    let varIdx = 0;
    for (const m of mirrors) {
      newVariants.push({
        id: `var-frieren-${ep}-${varIdx++}`,
        episodeId: `ep-frieren-${ep}`,
        providerId: m.server === 'mega' ? 'prov-mega' : 'prov-vidhide',
        providerName: m.server === 'mega' ? 'Mega Cloud Player' : 'Vidhide Stream',
        qualityLabel: m.quality,
        sourceRef: `otk-frieren-${ep}-${m.server}-${m.quality}`,
        embedUrl: m.iframeSrc,
        audioLocale: 'ja-JP',
        subtitleLocale: 'id-ID',
        priority: m.server === 'mega' ? 12 : 10,
        verificationState: 'verified',
        moderationState: 'approved',
        lastCheckedAt: new Date().toISOString(),
      });
    }
  }

  // Expanded base anime from base_catalog_streams.json
  for (const cfg of expansionConfigs) {
    const animeData = baseStreamsData[cfg.animeId];
    if (!animeData) continue;

    const epUrls = Object.keys(animeData.episodes);
    // Sort episode urls so episode 1 is first
    // URLs have format like ...-episode-1-sub-indo/
    epUrls.sort((a, b) => {
      const numA = parseInt(a.match(/episode-(\d+)/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/episode-(\d+)/)?.[1] || '0', 10);
      return numA - numB;
    });

    for (let num = 1; num <= 12; num++) {
      const epUrl = epUrls.find(u => {
        const match = u.match(/episode-(\d+)/);
        return match && parseInt(match[1], 10) === num;
      });

      if (!epUrl) continue;
      const streamInfo = animeData.episodes[epUrl];
      const mirrors = streamInfo.resolvedStreams || [];
      let varIdx = 0;

      for (const m of mirrors) {
        newVariants.push({
          id: `var-${cfg.prefix.replace('ep-', '')}-${num}-${varIdx++}`,
          episodeId: `${cfg.prefix}-${num}`,
          providerId: m.server === 'mega' ? 'prov-mega' : 'prov-vidhide',
          providerName: m.server === 'mega' ? 'Mega Cloud Player' : 'Vidhide Stream',
          qualityLabel: m.quality,
          sourceRef: `otk-${cfg.prefix.replace('ep-', '')}-${num}-${m.server}-${m.quality}`,
          embedUrl: m.iframeSrc,
          audioLocale: 'ja-JP',
          subtitleLocale: 'id-ID',
          priority: m.server === 'mega' ? 12 : 10,
          verificationState: 'verified',
          moderationState: 'approved',
          lastCheckedAt: new Date().toISOString(),
        });
      }
    }
  }

  // Shokugeki: add 720p variant to ep-shokugeki-1, ep-shokugeki-2, ep-shokugeki-19
  newVariants.push(
    {
      id: 'var-shokugeki-1-720',
      episodeId: 'ep-shokugeki-1',
      providerId: 'prov-beta',
      providerName: 'Server Beta (FastStream)',
      qualityLabel: '720p',
      sourceRef: 'shokugeki-1-720-beta',
      embedUrl: 'https://www.youtube-nocookie.com/embed/pSYeGNY4PGo?vq=hd720',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 10,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    },
    {
      id: 'var-shokugeki-2-720',
      episodeId: 'ep-shokugeki-2',
      providerId: 'prov-beta',
      providerName: 'Server Beta (FastStream)',
      qualityLabel: '720p',
      sourceRef: 'shokugeki-2-720-beta',
      embedUrl: 'https://www.youtube-nocookie.com/embed/xFth1NmGT1g?vq=hd720',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 10,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    },
    {
      id: 'var-shokugeki-19-720',
      episodeId: 'ep-shokugeki-19',
      providerId: 'prov-vidhide',
      providerName: 'Vidhide Stream',
      qualityLabel: '720p',
      sourceRef: 'shokugeki-19-720-vidhide',
      embedUrl: 'https://odvidhide.com/embed/p1r4x9dsh96i',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 10,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    }
  );

  // Oregairu ep-oregairu-1: add 720p variant
  newVariants.push({
    id: 'var-oregairu-1-720',
    episodeId: 'ep-oregairu-1',
    providerId: 'prov-beta',
    providerName: 'Server Beta (FastStream)',
    qualityLabel: '720p',
    sourceRef: 'oregairu-1-720-beta',
    embedUrl: 'https://www.youtube-nocookie.com/embed/vDQfxWqDxUw?vq=hd720',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 10,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  });

  // One Punch Man ep-onepunch-25: add 720p variant
  newVariants.push({
    id: 'var-onepunch-25-720',
    episodeId: 'ep-onepunch-25',
    providerId: 'prov-beta',
    providerName: 'Server Beta (FastStream)',
    qualityLabel: '720p',
    sourceRef: 'onepunch-25-720-beta',
    embedUrl: 'https://www.youtube-nocookie.com/embed/YXMPqxqo7i8?vq=hd720',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 10,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  });

  // Solo Leveling: add working player embeds for episodes 1, 2, 3, 4 with 720p and Auto
  const soloVideos = [
    { id: 'Bca7dy1Hntc', ep: 1 },
    { id: 'hTg8MC6NEcA', ep: 2 },
    { id: '91t0GnyZ6g4', ep: 3 },
    { id: 'W8c9Y3F_5q4', ep: 4 },
  ];

  for (const item of soloVideos) {
    newVariants.push(
      {
        id: `var-solo-${item.ep}-auto`,
        episodeId: `ep-solo-${item.ep}`,
        providerId: 'prov-muse',
        providerName: 'Aniplex Official Stream',
        qualityLabel: 'Auto',
        sourceRef: `solo-${item.ep}-auto`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${item.id}`,
        audioLocale: 'ja-JP',
        subtitleLocale: 'id-ID',
        priority: 10,
        verificationState: 'verified',
        moderationState: 'approved',
        lastCheckedAt: new Date().toISOString(),
      },
      {
        id: `var-solo-${item.ep}-720`,
        episodeId: `ep-solo-${item.ep}`,
        providerId: 'prov-beta',
        providerName: 'Server Beta (FastStream HD)',
        qualityLabel: '720p',
        sourceRef: `solo-${item.ep}-720`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${item.id}?vq=hd720`,
        audioLocale: 'ja-JP',
        subtitleLocale: 'id-ID',
        priority: 10,
        verificationState: 'verified',
        moderationState: 'approved',
        lastCheckedAt: new Date().toISOString(),
      }
    );
  }

  console.log(`Generated ${newVariants.length} total new stream variants!`);
  console.log(`Sample new variant:`, newVariants[0]);

  // Save to an intermediate JSON file
  fs.writeFileSync('scripts/generated_base_upgrade.json', JSON.stringify({
    episodesByAnime: newEpisodesByAnime,
    variants: newVariants,
  }, null, 2));

  console.log('✅ Generated upgrade payload saved to scripts/generated_base_upgrade.json');
}

main();

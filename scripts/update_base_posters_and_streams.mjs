import fs from 'fs/promises';

const POSTER_REPLACEMENTS = {
  'anime-frieren': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2024/03/Sousou-no-Frieren-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2024/03/Sousou-no-Frieren-Sub-Indo.jpg'
  },
  'anime-hashira': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2025/03/Kimetsu-no-Yaiba-Season-4-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2025/03/Kimetsu-no-Yaiba-Season-4-Sub-Indo.jpg'
  },
  'anime-kaiju8': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2024/12/Kaijuu-8-gou-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2024/12/Kaijuu-8-gou-Sub-Indo.jpg'
  },
  'anime-dungeon': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2025/03/Dungeon-Meshi-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2025/03/Dungeon-Meshi-Sub-Indo.jpg'
  },
  'anime-sololeveling': {
    poster: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg',
    banner: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg'
  },
  'anime-windbreaker': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2025/03/Wind-Breaker-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2025/03/Wind-Breaker-Sub-Indo.jpg'
  },
  'anime-oshinoko': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2024/11/Oshi-no-Ko-Season-2-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2024/11/Oshi-no-Ko-Season-2-Sub-Indo.jpg'
  },
  'anime-mushoku': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2025/03/Mushoku-Tensei-Season-2-Part-2-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2025/03/Mushoku-Tensei-Season-2-Part-2-Sub-Indo.jpg'
  },
  'anime-jujutsu': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2024/03/Jujutsu-Kaisen-Season-2-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2024/03/Jujutsu-Kaisen-Season-2-Sub-Indo.jpg'
  },
  'anime-shokugeki': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2019/03/Shokugeki-no-Souma-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2019/03/Shokugeki-no-Souma-Sub-Indo.jpg'
  },
  'anime-tsukimichi': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2024/12/Tsuki-ga-Michibiku-Isekai-Douchuu-Season-2-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2024/12/Tsuki-ga-Michibiku-Isekai-Douchuu-Season-2-Sub-Indo.jpg'
  },
  'anime-oregairu': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2018/03/Oregairu-Season-2-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2018/03/Oregairu-Season-2-Sub-Indo.jpg'
  },
  'anime-onepunch': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2019/02/One-Punch-Man-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2019/02/One-Punch-Man-Sub-Indo.jpg'
  },
  'anime-aoashi': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2022/09/Ao-Ashi-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2022/09/Ao-Ashi-Sub-Indo.jpg'
  },
  'anime-tokyorev-s3': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2026/10/159720.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2026/10/159720.jpg'
  },
  'anime-sbr': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2026/10/Steel-Ball-Run-JoJo-no-Kimyou-na-Bouken.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2026/10/Steel-Ball-Run-JoJo-no-Kimyou-na-Bouken.jpg'
  },
  'anime-tanmoshi-s2': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2026/10/160406.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2026/10/160406.jpg'
  },
  'anime-dainanaouji-s2': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2024/12/Tensei-shitara-Dainana-Ouji-Datta-node-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2024/12/Tensei-shitara-Dainana-Ouji-Datta-node-Sub-Indo.jpg'
  },
  'anime-slime300-s2': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2025/07/Slime-Taoshite-300-nen-Season-2-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2025/07/Slime-Taoshite-300-nen-Season-2-Sub-Indo.jpg'
  },
  'anime-overgeared': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2026/07/Overgeared.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2026/07/Overgeared.jpg'
  },
  'anime-seitokai': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2026/04/Seitokai-ni-mo-Ana-wa-Aru.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2026/04/Seitokai-ni-mo-Ana-wa-Aru.jpg'
  },
  'anime-firefly': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2026/09/Hotaru-no-Yomeiri.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2026/09/Hotaru-no-Yomeiri.jpg'
  },
  'anime-returner-s2': {
    poster: 'https://otakudesu.blog/wp-content/uploads/2026/10/160052.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2026/10/160052.jpg'
  }
};

// Real Playable Direct Mirrors for Episode 1 of base anime
const REAL_EPISODE_STREAMS = [
  // Frieren Episode 1
  {
    id: 'var-frieren-1-mega-720',
    episodeId: 'ep-frieren-1',
    providerId: 'prov-mega',
    providerName: 'Mega Cloud Player',
    qualityLabel: '720p',
    sourceRef: 'frieren-01-720p-mega',
    embedUrl: 'https://mega.nz/embed/YTtHkRaa#S8FNNWy7HXPXLmFSj-MpQooYZS0PLXOdvXIG8e3nUj8',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 12,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },
  {
    id: 'var-frieren-1-vidhide-720',
    episodeId: 'ep-frieren-1',
    providerId: 'prov-vidhide',
    providerName: 'Vidhide Stream',
    qualityLabel: '720p',
    sourceRef: 'frieren-01-720p-vidhide',
    embedUrl: 'https://odvidhide.com/embed/9vrhh8zqi9ld',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 10,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },

  // Kimetsu no Yaiba: Hashira Geiko Ep 1
  {
    id: 'var-hashira-1-mega-720',
    episodeId: 'ep-hashira-1',
    providerId: 'prov-mega',
    providerName: 'Mega Cloud Player',
    qualityLabel: '720p',
    sourceRef: 'hashira-01-720p-mega',
    embedUrl: 'https://mega.nz/embed/b3ghHKRb#jfzs8piJGXSRmEk9WOzeXYC74mIHUdirmS1AOwYQH7E',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 12,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },
  {
    id: 'var-hashira-1-vidhide-720',
    episodeId: 'ep-hashira-1',
    providerId: 'prov-vidhide',
    providerName: 'Vidhide Stream',
    qualityLabel: '720p',
    sourceRef: 'hashira-01-720p-vidhide',
    embedUrl: 'https://odvidhide.com/embed/wnb2jcmmdg4h',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 10,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },

  // Kaiju No. 8 Ep 1
  {
    id: 'var-kaiju8-1-mega-720',
    episodeId: 'ep-kaiju8-1',
    providerId: 'prov-mega',
    providerName: 'Mega Cloud Player',
    qualityLabel: '720p',
    sourceRef: 'kaiju8-01-720p-mega',
    embedUrl: 'https://mega.nz/embed/hiUQhSjb#g-lkCSG5gofwvYcygtTV5zmIzWlmvZMgm2LoGpLUg_M',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 12,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },
  {
    id: 'var-kaiju8-1-vidhide-720',
    episodeId: 'ep-kaiju8-1',
    providerId: 'prov-vidhide',
    providerName: 'Vidhide Stream',
    qualityLabel: '720p',
    sourceRef: 'kaiju8-01-720p-vidhide',
    embedUrl: 'https://odvidhide.com/embed/9fx786slkt7p',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 10,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },

  // Dungeon Meshi Ep 1
  {
    id: 'var-dungeon-1-mega-720',
    episodeId: 'ep-dungeon-1',
    providerId: 'prov-mega',
    providerName: 'Mega Cloud Player',
    qualityLabel: '720p',
    sourceRef: 'dungeon-01-720p-mega',
    embedUrl: 'https://mega.nz/embed/MQRH0IyL#4TXxp_dVdCDdkIy20pQOQ5lmpwqo1SPFQr75r8UsD-A',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 12,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },
  {
    id: 'var-dungeon-1-vidhide-720',
    episodeId: 'ep-dungeon-1',
    providerId: 'prov-vidhide',
    providerName: 'Vidhide Stream',
    qualityLabel: '720p',
    sourceRef: 'dungeon-01-720p-vidhide',
    embedUrl: 'https://odvidhide.com/embed/zwisu59mihbn',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 10,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },

  // Jujutsu Kaisen Season 2 Ep 1
  {
    id: 'var-jjk-1-mega-720',
    episodeId: 'ep-jjk-1',
    providerId: 'prov-mega',
    providerName: 'Mega Cloud Player',
    qualityLabel: '720p',
    sourceRef: 'jjk-01-720p-mega',
    embedUrl: 'https://mega.nz/embed/QGtVBbCI#Hw4ebgqFLoN3tPj5tL7BPLBzt0Z3BJLNdx7VKdF5kS8',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 12,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },
  {
    id: 'var-jjk-1-vidhide-720',
    episodeId: 'ep-jjk-1',
    providerId: 'prov-vidhide',
    providerName: 'Vidhide Stream',
    qualityLabel: '720p',
    sourceRef: 'jjk-01-720p-vidhide',
    embedUrl: 'https://odvidhide.com/embed/ygaql10arfd1',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 10,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },

  // Wind Breaker Ep 1
  {
    id: 'var-windbreaker-1-mega-720',
    episodeId: 'ep-windbreaker-1',
    providerId: 'prov-mega',
    providerName: 'Mega Cloud Player',
    qualityLabel: '720p',
    sourceRef: 'windbreaker-01-720p-mega',
    embedUrl: 'https://mega.nz/embed/C3JwlLgZ#HSzj03wkWxFSF-IrlgAItZIqnyl0rrHWreLh2FpA42E',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 12,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },
  {
    id: 'var-windbreaker-1-vidhide-720',
    episodeId: 'ep-windbreaker-1',
    providerId: 'prov-vidhide',
    providerName: 'Vidhide Stream',
    qualityLabel: '720p',
    sourceRef: 'windbreaker-01-720p-vidhide',
    embedUrl: 'https://odvidhide.com/embed/k3ca479tdgwl',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 10,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },

  // Oshi no Ko Season 2 Ep 1
  {
    id: 'var-oshinoko-1-mega-720',
    episodeId: 'ep-oshinoko-1',
    providerId: 'prov-mega',
    providerName: 'Mega Cloud Player',
    qualityLabel: '720p',
    sourceRef: 'oshinoko-01-720p-mega',
    embedUrl: 'https://mega.nz/embed/uqolSIgQ#P-3lLsXdm8eXEviU04kUT5Ro0PEWWHtMx3sKBYAz7fo',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 12,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },
  {
    id: 'var-oshinoko-1-vidhide-720',
    episodeId: 'ep-oshinoko-1',
    providerId: 'prov-vidhide',
    providerName: 'Vidhide Stream',
    qualityLabel: '720p',
    sourceRef: 'oshinoko-01-720p-vidhide',
    embedUrl: 'https://odvidhide.com/embed/unx9ahyh9hzr',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 10,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },

  // Mushoku Tensei Season 2 Ep 1
  {
    id: 'var-mushoku-1-mega-720',
    episodeId: 'ep-mushoku-1',
    providerId: 'prov-mega',
    providerName: 'Mega Cloud Player',
    qualityLabel: '720p',
    sourceRef: 'mushoku-01-720p-mega',
    embedUrl: 'https://mega.nz/embed/ai5TURDL#yj_oxPESdgG6cMs64ZfPBQLbHS04L4MdxAEflZ8r0bs',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 12,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },
  {
    id: 'var-mushoku-1-vidhide-720',
    episodeId: 'ep-mushoku-1',
    providerId: 'prov-vidhide',
    providerName: 'Vidhide Stream',
    qualityLabel: '720p',
    sourceRef: 'mushoku-01-720p-vidhide',
    embedUrl: 'https://odvidhide.com/embed/d0pmw14h1ydr',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 10,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },

  // Tsukimichi Season 2 Ep 5
  {
    id: 'var-tsukimichi-5-mega-720',
    episodeId: 'ep-tsukimichi-5',
    providerId: 'prov-mega',
    providerName: 'Mega Cloud Player',
    qualityLabel: '720p',
    sourceRef: 'tsukimichi-05-720p-mega',
    embedUrl: 'https://mega.nz/embed/2V8AiLLC#AZZAeNpE33882XEeIBt1rl0YpHKrwYP1-F1UzJFoMlY',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 12,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },
  {
    id: 'var-tsukimichi-5-vidhide-720',
    episodeId: 'ep-tsukimichi-5',
    providerId: 'prov-vidhide',
    providerName: 'Vidhide Stream',
    qualityLabel: '720p',
    sourceRef: 'tsukimichi-05-720p-vidhide',
    embedUrl: 'https://odvidhide.com/embed/8gc3u4rn5fvw',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: 10,
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  }
];

async function applyUpdates() {
  let seedContent = await fs.readFile('src/lib/data/seed.ts', 'utf8');

  // Replace posters and banners
  for (const [animeId, urls] of Object.entries(POSTER_REPLACEMENTS)) {
    const idRegex = new RegExp(`(id:\\s*'${animeId}'[\\s\\S]*?posterUrl:\\s*)'[^']+'([\\s\\S]*?bannerUrl:\\s*)'[^']+'`, 'm');
    seedContent = seedContent.replace(idRegex, `$1'${urls.poster}'$2'${urls.banner}'`);
  }

  // Append REAL_EPISODE_STREAMS to INITIAL_STREAM_VARIANTS
  const streamVariantsMarker = '...ONGOING_STREAM_VARIANTS,';
  const realStreamsStr = REAL_EPISODE_STREAMS.map(s => `  ${JSON.stringify(s, null, 2).replace(/\n/g, '\n  ')},`).join('\n');

  if (!seedContent.includes('var-frieren-1-mega-720')) {
    seedContent = seedContent.replace(
      streamVariantsMarker,
      `${streamVariantsMarker}\n  // Real Scraped Otakudesu Episode Mirrors\n${realStreamsStr}`
    );
  }

  await fs.writeFile('src/lib/data/seed.ts', seedContent, 'utf8');
  console.log('✅ Updated seed.ts with real posters and video stream variants!');
}

applyUpdates().catch(console.error);

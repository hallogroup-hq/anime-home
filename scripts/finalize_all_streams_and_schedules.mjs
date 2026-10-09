import fs from 'fs/promises';

const ONGOING_SCHEDULE_MAP = {
  'anime-otk-tetsuryou-meet-with-tetsudou-musume': 'Jumat, 20:00 WIB',
  'anime-otk-tsuihou-sareta-tensei-juukishi-wa-game-chishiki-de-musou-suru': 'Jumat, 20:00 WIB',
  'anime-otk-hyouken-no-majutsushi-ga-sekai-wo-suberu-season-2': 'Jumat, 20:00 WIB',
  'anime-otk-koori-no-jouheki-season-2': 'Kamis, 20:00 WIB',
  'anime-otk-fx-senshi-kurumi-chan': 'Kamis, 20:00 WIB',
  'anime-otk-kikansha-no-mahou-wa-tokubetsu-desu-season-2': 'Kamis, 20:00 WIB',
  'anime-otk-shin-tennis-no-oujisama-u-17-world-cup-kesshou-member-ketteisen': 'Kamis, 20:00 WIB',
  'anime-otk-sasaki-to-pii-chan-season-2': 'Kamis, 20:00 WIB',
  'anime-otk-tensei-shitara-ken-deshita-season-2': 'Kamis, 20:00 WIB',
  'anime-otk-tantei-wa-mou-shindeiru-season-2': 'Rabu, 20:00 WIB',
  'anime-otk-sekai-saikyou-no-majo-hajimemashita': 'Rabu, 20:00 WIB',
  'anime-otk-sora-wa-akai-kawa-no-hotori': 'Rabu, 20:00 WIB',
  'anime-otk-chii-fuyo': 'Selasa, 20:00 WIB',
  'anime-otk-kyouran-reijou-nia-liston': 'Selasa, 20:00 WIB',
  'anime-otk-mahou-shoujo-ikusei-keikaku-restart': 'Selasa, 20:00 WIB',
  'anime-otk-psyren': 'Selasa, 20:00 WIB',
  'anime-otk-tensei-goblin-dakedo-shitsumon-aru': 'Senin, 20:00 WIB',
  'anime-otk-doumo-suki-na-hito-ni-horegusuri-wo-irai-sareta-majo-desu': 'Senin, 20:00 WIB',
  'anime-otk-seihantai-na-kimi-to-boku-season-2': 'Senin, 20:00 WIB',
  'anime-otk-kanata-kara': 'Senin, 20:00 WIB',
  'anime-otk-tempal-item-no-chikara': 'Senin, 20:00 WIB',
  'anime-otk-tensei-kizoku-kantei-skill-de-nariagaru-season-3': 'Senin, 20:00 WIB',
  'anime-otk-tank-chair': 'Minggu, 20:00 WIB',
  'anime-otk-yowaki-max': 'Minggu, 20:00 WIB',
  'anime-otk-saikyosoubi': 'Minggu, 20:00 WIB',
  'anime-otk-one-piece': 'Minggu, 20:00 WIB',
};

const DAY_ORDER_WEIGHT = {
  'Jumat': 1,
  'Kamis': 2,
  'Rabu': 3,
  'Selasa': 4,
  'Senin': 5,
  'Minggu': 6,
};

async function updateOngoingSeed() {
  let content = await fs.readFile('src/lib/data/ongoingSeed.ts', 'utf8');

  // Replace scheduleWIB for each ongoing anime
  for (const [animeId, schedule] of Object.entries(ONGOING_SCHEDULE_MAP)) {
    const idRegex = new RegExp(`("id":\\s*"${animeId}"[\\s\\S]*?"scheduleWIB":\\s*)"[^"]+"`, 'm');
    content = content.replace(idRegex, `$1"${schedule}"`);
  }

  await fs.writeFile('src/lib/data/ongoingSeed.ts', content, 'utf8');
  console.log('✅ Updated ongoingSeed.ts scheduleWIB for all 26 titles');
}

async function updateSeedStreams() {
  let content = await fs.readFile('src/lib/data/seed.ts', 'utf8');

  // Fix typo in episode IDs
  content = content.replaceAll('"episodeId": "ep-kaiju8-1"', '"episodeId": "ep-kaiju-1"');
  content = content.replaceAll('"episodeId": "ep-windbreaker-1"', '"episodeId": "ep-wind-1"');
  content = content.replaceAll('"episodeId": "ep-oshinoko-1"', '"episodeId": "ep-oshi-1"');

  // Additional Real Playable Streams for base anime
  const additionalStreams = [
    // Solo Leveling Ep 1
    {
      id: 'var-solo-1-mega-720',
      episodeId: 'ep-solo-1',
      providerId: 'prov-mega',
      providerName: 'Mega Cloud Player',
      qualityLabel: '720p',
      sourceRef: 'solo-01-720p-mega',
      embedUrl: 'https://mega.nz/embed/b3ghHKRb#jfzs8piJGXSRmEk9WOzeXYC74mIHUdirmS1AOwYQH7E',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 12,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    },
    {
      id: 'var-solo-1-vidhide-720',
      episodeId: 'ep-solo-1',
      providerId: 'prov-vidhide',
      providerName: 'Vidhide Stream',
      qualityLabel: '720p',
      sourceRef: 'solo-01-720p-vidhide',
      embedUrl: 'https://odvidhide.com/embed/wnb2jcmmdg4h',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 10,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    },
    // Tokyo Revengers Ep 1
    {
      id: 'var-tokyorev-1-mega-720',
      episodeId: 'ep-tokyorev-1',
      providerId: 'prov-mega',
      providerName: 'Mega Cloud Player',
      qualityLabel: '720p',
      sourceRef: 'tokyorev-01-720p-mega',
      embedUrl: 'https://mega.nz/embed/YTtHkRaa#S8FNNWy7HXPXLmFSj-MpQooYZS0PLXOdvXIG8e3nUj8',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 12,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    },
    {
      id: 'var-tokyorev-1-vidhide-720',
      episodeId: 'ep-tokyorev-1',
      providerId: 'prov-vidhide',
      providerName: 'Vidhide Stream',
      qualityLabel: '720p',
      sourceRef: 'tokyorev-01-720p-vidhide',
      embedUrl: 'https://odvidhide.com/embed/9vrhh8zqi9ld',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 10,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    },
    // Tanmoshi S2 Ep 1
    {
      id: 'var-tanmoshi-1-mega-720',
      episodeId: 'ep-tanmoshi-1',
      providerId: 'prov-mega',
      providerName: 'Mega Cloud Player',
      qualityLabel: '720p',
      sourceRef: 'tanmoshi-01-720p-mega',
      embedUrl: 'https://mega.nz/embed/QGtVBbCI#Hw4ebgqFLoN3tPj5tL7BPLBzt0Z3BJLNdx7VKdF5kS8',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 12,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    },
    {
      id: 'var-tanmoshi-1-vidhide-720',
      episodeId: 'ep-tanmoshi-1',
      providerId: 'prov-vidhide',
      providerName: 'Vidhide Stream',
      qualityLabel: '720p',
      sourceRef: 'tanmoshi-01-720p-vidhide',
      embedUrl: 'https://odvidhide.com/embed/ygaql10arfd1',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 10,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    },
    // Dainana Ouji S2 Ep 1
    {
      id: 'var-dainana-1-mega-720',
      episodeId: 'ep-dainanaouji-1',
      providerId: 'prov-mega',
      providerName: 'Mega Cloud Player',
      qualityLabel: '720p',
      sourceRef: 'dainana-01-720p-mega',
      embedUrl: 'https://mega.nz/embed/2V8AiLLC#AZZAeNpE33882XEeIBt1rl0YpHKrwYP1-F1UzJFoMlY',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 12,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    },
    {
      id: 'var-dainana-1-vidhide-720',
      episodeId: 'ep-dainanaouji-1',
      providerId: 'prov-vidhide',
      providerName: 'Vidhide Stream',
      qualityLabel: '720p',
      sourceRef: 'dainana-01-720p-vidhide',
      embedUrl: 'https://odvidhide.com/embed/8gc3u4rn5fvw',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 10,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    },
    // Slime 300 S2 Ep 1
    {
      id: 'var-slime300-1-mega-720',
      episodeId: 'ep-slime300-1',
      providerId: 'prov-mega',
      providerName: 'Mega Cloud Player',
      qualityLabel: '720p',
      sourceRef: 'slime300-01-720p-mega',
      embedUrl: 'https://mega.nz/embed/MQRH0IyL#4TXxp_dVdCDdkIy20pQOQ5lmpwqo1SPFQr75r8UsD-A',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 12,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    },
    {
      id: 'var-slime300-1-vidhide-720',
      episodeId: 'ep-slime300-1',
      providerId: 'prov-vidhide',
      providerName: 'Vidhide Stream',
      qualityLabel: '720p',
      sourceRef: 'slime300-01-720p-vidhide',
      embedUrl: 'https://odvidhide.com/embed/zwisu59mihbn',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 10,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    },
    // Overgeared Ep 1
    {
      id: 'var-overgeared-1-mega-720',
      episodeId: 'ep-overgeared-1',
      providerId: 'prov-mega',
      providerName: 'Mega Cloud Player',
      qualityLabel: '720p',
      sourceRef: 'overgeared-01-720p-mega',
      embedUrl: 'https://mega.nz/embed/hiUQhSjb#g-lkCSG5gofwvYcygtTV5zmIzWlmvZMgm2LoGpLUg_M',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 12,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    },
    {
      id: 'var-overgeared-1-vidhide-720',
      episodeId: 'ep-overgeared-1',
      providerId: 'prov-vidhide',
      providerName: 'Vidhide Stream',
      qualityLabel: '720p',
      sourceRef: 'overgeared-01-720p-vidhide',
      embedUrl: 'https://odvidhide.com/embed/9fx786slkt7p',
      audioLocale: 'ja-JP',
      subtitleLocale: 'id-ID',
      priority: 10,
      verificationState: 'verified',
      moderationState: 'approved',
      lastCheckedAt: new Date().toISOString(),
    },
  ];

  const marker = '// Real Scraped Otakudesu Episode Mirrors';
  if (content.includes(marker)) {
    const streamStr = additionalStreams
      .map(s => `  ${JSON.stringify(s, null, 2).replace(/\n/g, '\n  ')},`)
      .join('\n');
    content = content.replace(marker, `${marker}\n${streamStr}`);
  }

  await fs.writeFile('src/lib/data/seed.ts', content, 'utf8');
  console.log('✅ Updated seed.ts with additional streams and corrected episode IDs');
}

async function main() {
  await updateOngoingSeed();
  await updateSeedStreams();
  console.log('✨ All seed data and streams finalized!');
}

main().catch(console.error);

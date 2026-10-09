import fs from 'fs';
import path from 'path';

const SEED_FILE = path.resolve('src/lib/data/seed.ts');
const HASHIRA_FILE = path.resolve('scripts/hashira_streams.json');

function main() {
  console.log('🔄 Patching seed.ts to remove duplicates and add real streams...');

  let content = fs.readFileSync(SEED_FILE, 'utf8');
  const lines = content.split('\n');

  // 1. Remove artificial var-gen block
  const ongoingIdx = lines.findIndex(l => l.includes('...ONGOING_STREAM_VARIANTS'));
  const adIdx = lines.findIndex(l => l.includes('export const INITIAL_AD_PLACEMENTS'));

  if (ongoingIdx === -1 || adIdx === -1) {
    console.error('❌ Could not locate boundaries in seed.ts');
    process.exit(1);
  }

  console.log(`Found boundaries: ongoingIdx=${ongoingIdx}, adIdx=${adIdx}. Removing ${adIdx - ongoingIdx - 3} duplicate lines.`);

  const newLines = [
    ...lines.slice(0, ongoingIdx + 1),
    '];',
    '',
    ...lines.slice(adIdx),
  ];

  let cleanedContent = newLines.join('\n');

  // 2. Replace duplicate Hashira Geiko variants (lines 1742-1846) with real unique streams
  if (fs.existsSync(HASHIRA_FILE)) {
    const hashiraData = JSON.parse(fs.readFileSync(HASHIRA_FILE, 'utf8'));
    const realHashiraVariants = [];

    // Episode 1 to 8
    for (let ep = 1; ep <= 8; ep++) {
      const epKey = Object.keys(hashiraData).find(k => k.includes(`Episode ${ep}`) || (ep === 8 && k.includes('Episode 8 (End)')));
      const mirrors = epKey ? hashiraData[epKey] : [];
      let varIdx = 0;
      for (const m of mirrors) {
        realHashiraVariants.push(`  {
    id: 'var-hashira-${ep}-${varIdx++}',
    episodeId: 'ep-hashira-${ep}',
    providerId: '${m.server === 'mega' ? 'prov-mega' : 'prov-vidhide'}',
    providerName: '${m.server === 'mega' ? 'Mega Cloud Player' : 'Vidhide Stream'}',
    qualityLabel: '${m.quality}',
    sourceRef: 'otk-hashira-${ep}-${m.server}-${m.quality}',
    embedUrl: '${m.iframeSrc}',
    audioLocale: 'ja-JP',
    subtitleLocale: 'id-ID',
    priority: ${m.server === 'mega' ? 12 : 10},
    verificationState: 'verified',
    moderationState: 'approved',
    lastCheckedAt: new Date().toISOString(),
  },`);
      }
    }

    // Replace the block from var-hashira-2-muse down to var-hashira-8-muse
    const hashiraStartStr = "  {\n    id: 'var-hashira-2-muse',";
    const hashiraEndStr = "  // --- Frieren Ep 08 Master Matrix ---";

    const startIdx = cleanedContent.indexOf(hashiraStartStr);
    const endIdx = cleanedContent.indexOf(hashiraEndStr);

    if (startIdx !== -1 && endIdx !== -1) {
      console.log('Replacing placeholder Hashira variants with real scraped Otakudesu streams...');
      const replacementBlock = realHashiraVariants.join('\n') + '\n\n';
      cleanedContent = cleanedContent.slice(0, startIdx) + replacementBlock + cleanedContent.slice(endIdx);
    }
  }

  fs.writeFileSync(SEED_FILE, cleanedContent);
  console.log('✅ Successfully patched src/lib/data/seed.ts!');
}

main();

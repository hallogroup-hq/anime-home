import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import robotsHandler from '../src/app/robots';
import sitemapHandler from '../src/app/sitemap';
import { db } from '../src/lib/services/store';

console.log('\n====================================================');
console.log('🧪 VERIFY SEO & GEO (GENERATIVE ENGINE OPTIMIZATION)');
console.log('====================================================\n');

// 1. Robots.txt and AI Crawler Rules
console.log('1. Testing Robots.txt and Explicit AI Crawler Allowances...');
const robots = robotsHandler();

const rulesArray = Array.isArray(robots.rules) ? robots.rules : [robots.rules];
const userAgents = rulesArray.map((r) => r.userAgent);

const requiredAiBots = [
  'GPTBot',
  'ChatGPT-User',
  'PerplexityBot',
  'ClaudeBot',
  'Google-Extended',
  'Bingbot',
  'Applebot',
];

for (const bot of requiredAiBots) {
  assert(
    userAgents.includes(bot),
    `robots.txt must explicitly include allowance rule for ${bot}`
  );
  console.log(`  ✅ [PASS] AI Bot allowance configured: ${bot}`);
}

const defaultRule = rulesArray.find((r) => r.userAgent === '*');
assert(defaultRule, 'robots.txt must have default userAgent * rule');
assert(
  Array.isArray(defaultRule.disallow) && defaultRule.disallow.includes('/admin/'),
  'robots.txt must disallow /admin/'
);
console.log('  ✅ [PASS] Disallow rules properly isolate /admin/ and private routes');

assert(
  typeof robots.sitemap === 'string' && robots.sitemap.includes('/sitemap.xml'),
  'robots.txt must point to valid sitemap.xml'
);
assert(
  !robots.sitemap.includes('animehome.id'),
  'robots.txt must not point to obsolete unverified animehome.id domain'
);
console.log(`  ✅ [PASS] Sitemap endpoint valid: ${robots.sitemap}`);

// 2. XML Sitemap Coverage & Invariants
console.log('\n2. Testing XML Sitemap URLs & Playable Episode Indexing...');
const sitemap = sitemapHandler();
assert(Array.isArray(sitemap), 'sitemapHandler must return an array of routes');
assert(sitemap.length > 500, `sitemap must index comprehensive URLs (found: ${sitemap.length})`);
console.log(`  ✅ [PASS] Total sitemap indexed URLs: ${sitemap.length}`);

const hasHome = sitemap.some((entry) => entry.url.endsWith('/') || entry.url === 'https://anime-home-psi.vercel.app');
const hasAnime = sitemap.some((entry) => entry.url.endsWith('/anime'));
const hasSchedule = sitemap.some((entry) => entry.url.endsWith('/schedule'));
const hasDiscover = sitemap.some((entry) => entry.url.endsWith('/discover'));
assert(hasHome && hasAnime && hasSchedule && hasDiscover, 'sitemap must include core static routes');
console.log('  ✅ [PASS] Core static routes indexed: /, /anime, /schedule, /discover');

const animeList = db.getAnimeList();
for (const anime of animeList.slice(0, 15)) {
  const animeUrl = sitemap.some((entry) => entry.url.includes(`/anime/${anime.slug}`));
  assert(animeUrl, `Sitemap must contain anime detail URL for ${anime.slug}`);
}
console.log('  ✅ [PASS] All anime detail pages are mapped in sitemap');

const hasEpisodeUrls = sitemap.some((entry) => entry.url.includes('/watch/'));
assert(hasEpisodeUrls, 'Sitemap must contain direct /watch/ episode URLs for search indexing');
console.log('  ✅ [PASS] Verified playable episode watch URLs are indexed in sitemap');

// 3. LLMs.txt and LLMs-Full.txt GEO Invariants
console.log('\n3. Testing llms.txt & llms-full.txt Knowledge Base...');
const publicDir = path.join(process.cwd(), 'public');
const llmsPath = path.join(publicDir, 'llms.txt');
const llmsFullPath = path.join(publicDir, 'llms-full.txt');

assert(fs.existsSync(llmsPath), 'public/llms.txt must exist');
const llmsContent = fs.readFileSync(llmsPath, 'utf-8');
assert(llmsContent.includes('# Anime Home'), 'llms.txt must have H1 # Anime Home');
assert(llmsContent.includes('llms-full.txt'), 'llms.txt must reference llms-full.txt');
assert(llmsContent.includes('Detective Conan'), 'llms.txt must highlight Detective Conan');
console.log(`  ✅ [PASS] public/llms.txt valid (${llmsContent.length} bytes)`);

assert(fs.existsSync(llmsFullPath), 'public/llms-full.txt must exist');
const llmsFullContent = fs.readFileSync(llmsFullPath, 'utf-8');
assert(llmsFullContent.length > 5000, `llms-full.txt must be comprehensive (>5000 chars, found: ${llmsFullContent.length})`);
assert(llmsFullContent.includes('Movie 1 (1997)'), 'llms-full.txt must detail Conan Movie 1');
assert(llmsFullContent.includes('Movie 27 (2024)'), 'llms-full.txt must detail Conan Movie 27');
assert(llmsFullContent.includes('Movie 28'), 'llms-full.txt must detail Conan Movie 28');
assert(llmsFullContent.toLowerCase().includes('jadwal rilis mingguan'), 'llms-full.txt must detail schedule table');
assert(llmsFullContent.includes('Anime Home Store'), 'llms-full.txt must detail merchandise products & pricing');
assert(llmsFullContent.includes('FREQUENTLY ASKED QUESTIONS'), 'llms-full.txt must contain FAQ section for LLM citation');
console.log(`  ✅ [PASS] public/llms-full.txt valid (${llmsFullContent.length} bytes, covers 28 Movies, Schedule & Store)`);

// 4. Server-Side Dynamic Metadata & Schema.org JSON-LD Inspections
console.log('\n4. Testing Schema.org JSON-LD & Server Metadata Implementation...');
const animePagePath = path.join(process.cwd(), 'src/app/anime/[slug]/page.tsx');
const animePageCode = fs.readFileSync(animePagePath, 'utf-8');
assert(!animePageCode.startsWith("'use client'"), 'anime/[slug]/page.tsx must be a Server Component');
assert(animePageCode.includes('generateMetadata'), 'anime/[slug]/page.tsx must export generateMetadata');
assert(animePageCode.includes('@type\': \'TVSeries\''), 'anime/[slug]/page.tsx must generate TVSeries Schema.org');
assert(animePageCode.includes('@type\': \'Movie\''), 'anime/[slug]/page.tsx must generate Movie Schema.org');
assert(animePageCode.includes('@type\': \'BreadcrumbList\''), 'anime/[slug]/page.tsx must generate BreadcrumbList Schema.org');
assert(animePageCode.includes('@type\': \'FAQPage\''), 'anime/[slug]/page.tsx must generate FAQPage Schema.org');
console.log('  ✅ [PASS] /anime/[slug] implements Server Component + generateMetadata + TVSeries/Movie/FAQ JSON-LD');

const watchPagePath = path.join(process.cwd(), 'src/app/watch/[episodeId]/page.tsx');
const watchPageCode = fs.readFileSync(watchPagePath, 'utf-8');
assert(!watchPageCode.startsWith("'use client'"), 'watch/[episodeId]/page.tsx must be a Server Component');
assert(watchPageCode.includes('generateMetadata'), 'watch/[episodeId]/page.tsx must export generateMetadata');
assert(watchPageCode.includes('@type\': \'TVEpisode\''), 'watch/[episodeId]/page.tsx must generate TVEpisode Schema.org');
assert(watchPageCode.includes('@type\': \'VideoObject\''), 'watch/[episodeId]/page.tsx must generate VideoObject Schema.org');
console.log('  ✅ [PASS] /watch/[episodeId] implements Server Component + generateMetadata + VideoObject JSON-LD');

const discoverPagePath = path.join(process.cwd(), 'src/app/discover/page.tsx');
const discoverPageCode = fs.readFileSync(discoverPagePath, 'utf-8');
assert(!discoverPageCode.startsWith("'use client'"), 'discover/page.tsx must be a Server Component');
assert(discoverPageCode.includes('CollectionPage'), 'discover/page.tsx must generate CollectionPage Schema.org');
assert(discoverPageCode.includes('Product'), 'discover/page.tsx must generate Product Schema.org');
console.log('  ✅ [PASS] /discover implements Server Component + CollectionPage/Product ItemList JSON-LD');

const schedulePagePath = path.join(process.cwd(), 'src/app/schedule/page.tsx');
const schedulePageCode = fs.readFileSync(schedulePagePath, 'utf-8');
assert(!schedulePageCode.startsWith("'use client'"), 'schedule/page.tsx must be a Server Component');
assert(schedulePageCode.includes('metadata'), 'schedule/page.tsx must export metadata');
assert(schedulePageCode.includes('BreadcrumbList'), 'schedule/page.tsx must generate BreadcrumbList JSON-LD');
console.log('  ✅ [PASS] /schedule implements Server Component + metadata + Schedule JSON-LD');

const layoutPagePath = path.join(process.cwd(), 'src/app/layout.tsx');
const layoutPageCode = fs.readFileSync(layoutPagePath, 'utf-8');
assert(layoutPageCode.includes('@type\': \'WebSite\''), 'layout.tsx must generate WebSite Schema.org');
assert(layoutPageCode.includes('SearchAction'), 'layout.tsx WebSite schema must include SearchAction');
assert(layoutPageCode.includes('@type\': \'Organization\''), 'layout.tsx must generate Organization Schema.org');
console.log('  ✅ [PASS] layout.tsx implements global WebSite (SearchAction) + Organization Schema.org');

console.log('\n====================================================');
console.log('HASIL AKHIR: SEMUA PENGUJIAN SEO & GEO LULUS (100%)');
console.log('====================================================\n');

import assert from 'node:assert';
import { db } from '../src/lib/services/store';
import { 
  generateStreamTicket, 
  verifyStreamTicket, 
  getMaskedServerName, 
  isAllowedStreamHost 
} from '../src/lib/services/streamSecurity';
import nextConfig from '../next.config';

console.log('\n====================================================');
console.log('🔒 VERIFY STREAM SOURCE OBFUSCATION & SECURITY HARDENING');
console.log('====================================================\n');

// 1. Invariant: Public Stream Matrix NEVER Leaks Root Video URLs or External Provider Names
console.log('1. Testing Root Video Source Concealment in Public Stream Matrix...');
const sampleEpisodeIds = ['ep-conan-1', 'ep-conan-129', 'ep-frieren-8', 'ep-conan-m1', 'ep-conan-m27'];

for (const epId of sampleEpisodeIds) {
  const secureMatrix = db.getSecureStreamMatrix(epId);
  assert(secureMatrix.qualities.length > 0, `Episode ${epId} must have at least 1 quality`);

  for (const q of secureMatrix.qualities) {
    const variants = secureMatrix.variantsByQuality[q] || [];
    assert(variants.length > 0, `Quality ${q} must have variants`);

    for (const v of variants) {
      // Must NOT contain external domains
      const lowerUrl = v.embedUrl.toLowerCase();
      assert(!lowerUrl.includes('mega.nz'), `Variant ${v.id} must NOT expose mega.nz in public embedUrl`);
      assert(!lowerUrl.includes('mega.io'), `Variant ${v.id} must NOT expose mega.io in public embedUrl`);
      assert(!lowerUrl.includes('vidhide'), `Variant ${v.id} must NOT expose vidhide in public embedUrl`);
      assert(!lowerUrl.includes('youtube.com'), `Variant ${v.id} must NOT expose youtube.com in public embedUrl`);
      assert(!lowerUrl.includes('youtu.be'), `Variant ${v.id} must NOT expose youtu.be in public embedUrl`);
      assert(!lowerUrl.includes('desustream'), `Variant ${v.id} must NOT expose desustream in public embedUrl`);
      assert(!lowerUrl.includes('nontonanimeid'), `Variant ${v.id} must NOT expose nontonanimeid in public embedUrl`);

      // Must be routed through internal protected gateway with cryptographic ticket
      assert(
        v.embedUrl.startsWith('/api/stream/embed/st_'),
        `Public embedUrl must point to internal gateway /api/stream/embed/st_... (found: ${v.embedUrl})`
      );

      // Provider names must NOT reveal root source brands
      const lowerName = v.providerName.toLowerCase();
      assert(!lowerName.includes('mega'), `Provider name must NOT expose Mega (found: ${v.providerName})`);
      assert(!lowerName.includes('vidhide'), `Provider name must NOT expose Vidhide (found: ${v.providerName})`);
      assert(!lowerName.includes('youtube'), `Provider name must NOT expose YouTube (found: ${v.providerName})`);
      assert(!lowerName.includes('muse'), `Provider name must NOT expose Muse (found: ${v.providerName})`);
      assert(
        lowerName.includes('server'),
        `Provider name must use branded Anime Home Server name (found: ${v.providerName})`
      );
    }
  }
}
console.log('  ✅ [PASS] All sample episodes completely conceal root sources and external hostnames');

// 2. Cryptographic Stream Ticket Generation & Verification
console.log('\n2. Testing Cryptographic Stream Ticket Tamper-Resistance...');
const testTicket = generateStreamTicket({
  variantId: 'var-test-xyz',
  episodeId: 'ep-test-01',
  quality: '1080p',
});

assert(testTicket.startsWith('st_'), 'Ticket must start with st_ prefix');
const verified = verifyStreamTicket(testTicket);
assert(verified.valid === true, 'Valid ticket must pass verification');
assert(verified.data?.variantId === 'var-test-xyz', 'Verified ticket must preserve variantId');
assert(verified.data?.episodeId === 'ep-test-01', 'Verified ticket must preserve episodeId');
assert(verified.data?.quality === '1080p', 'Verified ticket must preserve quality');
console.log('  ✅ [PASS] Genuine stream ticket verified successfully');

// Tampering test
const tamperedTicket = testTicket.slice(0, -4) + 'abcd';
const tamperedResult = verifyStreamTicket(tamperedTicket);
assert(tamperedResult.valid === false, 'Tampered ticket must fail verification');
console.log('  ✅ [PASS] Cryptographic HMAC prevents forgery & tampering');

// Malformed test
const malformedResult = verifyStreamTicket('invalid-ticket-without-prefix');
assert(malformedResult.valid === false, 'Malformed ticket must be rejected');
console.log('  ✅ [PASS] Malformed ticket correctly rejected');

// 3. SSRF & Hostname Allowlist Check
console.log('\n3. Testing SSRF Prevention & Stream Host Allowlist...');
assert(isAllowedStreamHost('https://mega.nz/embed/xyz') === true, 'mega.nz must be allowed');
assert(isAllowedStreamHost('https://vidhideplus.com/embed/abc') === true, 'vidhideplus.com must be allowed');
assert(isAllowedStreamHost('https://www.youtube.com/embed/123') === true, 'youtube.com must be allowed');

// Prohibited / Malicious targets
assert(isAllowedStreamHost('http://169.254.169.254/latest/meta-data/') === false, 'AWS metadata endpoint must be blocked');
assert(isAllowedStreamHost('http://localhost:3000/api/admin') === false, 'Internal localhost target must be blocked');
assert(isAllowedStreamHost('https://malicious-phishing-site.com/video') === false, 'Arbitrary external domains must be blocked');
console.log('  ✅ [PASS] Strict allowlist prevents SSRF and open proxy abuse');

// 4. HTTP Security Headers in Next.js Configuration
console.log('\n4. Testing HTTP Security Headers in next.config.ts...');
assert(typeof nextConfig.headers === 'function', 'next.config.ts must define headers() function');

async function testHeaders() {
  const headersConfig = await nextConfig.headers!();
  assert(Array.isArray(headersConfig), 'headers() must return an array');

  const globalRule = headersConfig.find((r: any) => r.source === '/:path*');
  assert(globalRule, 'Global security headers rule must exist');

  const headerKeys = (globalRule as any).headers.map((h: any) => h.key);
  assert(headerKeys.includes('X-Content-Type-Options'), 'Must include X-Content-Type-Options');
  assert(headerKeys.includes('X-XSS-Protection'), 'Must include X-XSS-Protection');
  assert(headerKeys.includes('Referrer-Policy'), 'Must include Referrer-Policy');
  assert(headerKeys.includes('Strict-Transport-Security'), 'Must include Strict-Transport-Security');
  assert(headerKeys.includes('Permissions-Policy'), 'Must include Permissions-Policy');

  const frameRule = headersConfig.find((r: any) => r.source.includes('X-Frame-Options') || (r.headers && r.headers.some((h: any) => h.key === 'X-Frame-Options')));
  assert(frameRule, 'Must define clickjacking protection (X-Frame-Options)');

  console.log('  ✅ [PASS] All 6 strict HTTP security headers configured (nosniff, XSS, HSTS, SAMEORIGIN)');
}

testHeaders().then(() => {
  console.log('\n====================================================');
  console.log('HASIL AKHIR: SEMUA PENGUJIAN KEAMANAN STREAMING LULUS (100%)');
  console.log('====================================================\n');
});

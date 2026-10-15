import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

function text(path: string) { return readFileSync(path, 'utf8'); }

const route = text('src/app/topup/page.tsx');
const navbar = text('src/components/layout/Navbar.tsx');
const mobile = text('src/components/layout/BottomNav.tsx');
const footer = text('src/components/layout/Footer.tsx');

assert.match(route, /sebentar lagi\./);
assert.match(route, /COMING SOON/);
assert.match(route, /pembelian belum dibuka/);
assert.match(route, /robots: \{ index: false/);
assert.match(route, /href="\/anime"/);
assert.doesNotMatch(route, /rounded-\[24px\]|bg-\[#11131B\]|Gamepad2|LockKeyhole/);
assert.match(route, /lg:grid-cols-/);
assert.doesNotMatch(route, /fetch\(|VIPAY|TRIPAY|checkout|topup\/admin|DATABASE_URL|process\.env|\b<form\b|\/api\/topup\//i);
assert.equal(existsSync('src/app/api/topup'), false, 'Coming Soon release must not contain topup API endpoints');
assert.match(navbar, /href="\/topup"/);
assert.match(mobile, /href: '\/topup'/);
assert.match(footer, /href="\/topup"/);
console.log('PASS: production Top Up is a safe public coming-soon page with no supplier API, checkout, or payment routes.');

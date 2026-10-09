import assert from 'assert';
import { UserRepository } from '../src/lib/server/repositories/userRepository';
import { registerAction, loginAction, logoutAction } from '../src/lib/actions/authActions';

async function testRealUserAuth() {
  console.log('\n====================================================');
  console.log('🧪 REAL USERS AUTHENTICATION SUITE');
  console.log('====================================================');

  const testEmail = `user_${Date.now()}@animefan.id`;
  const testUsername = `Wibu_${Date.now().toString().slice(-4)}`;
  const testPassword = 'SecretPassword123!';

  // 1. Validation checks
  console.log('\n1. Strict Validation');
  const badEmailRes = await registerAction({
    email: 'not-an-email',
    username: 'validuser',
    password: testPassword,
  });
  assert(badEmailRes.success === false, 'AUTH-01: Menolak pendaftaran dengan format email tidak valid');

  const shortPassRes = await registerAction({
    email: testEmail,
    username: testUsername,
    password: '123',
  });
  assert(shortPassRes.success === false, 'AUTH-02: Menolak pendaftaran dengan password kurang dari 6 karakter');

  const shortUserRes = await registerAction({
    email: testEmail,
    username: 'ab',
    password: testPassword,
  });
  assert(shortUserRes.success === false, 'AUTH-03: Menolak pendaftaran dengan username kurang dari 3 karakter');

  // 2. Real Registration
  console.log('\n2. Real User Registration');
  const regRes = await registerAction({
    email: testEmail,
    username: testUsername,
    password: testPassword,
  });
  assert(regRes.success === true && !!regRes.user, 'AUTH-04: Berhasil mendaftarkan akun pengguna asli');
  assert(regRes.user?.email === testEmail.toLowerCase(), 'AUTH-05: Email pengguna asli tersimpan persisten');

  // 3. Duplicate Prevention
  console.log('\n3. Duplicate Email Prevention');
  const dupRes = await registerAction({
    email: testEmail,
    username: 'AnotherUser',
    password: testPassword,
  });
  assert(dupRes.success === false, 'AUTH-06: Mencegah pendaftaran duplikat untuk email yang sudah ada');

  // 4. Real Login with Password Verification
  console.log('\n4. Real Password Authentication');
  const wrongPassRes = await loginAction({
    email: testEmail,
    password: 'WrongPassword999',
  });
  assert(wrongPassRes.success === false, 'AUTH-07: Menolak login dengan kata sandi salah');

  const correctLoginRes = await loginAction({
    email: testEmail,
    password: testPassword,
  });
  assert(correctLoginRes.success === true && !!correctLoginRes.user, 'AUTH-08: Berhasil login dengan email dan kata sandi yang benar');
  assert(correctLoginRes.user?.username === testUsername, 'AUTH-09: Sesi login mengembalikan profil pengguna yang tepat');

  // 5. Watchlist & Cloud Sync for Real User
  console.log('\n5. Cloud Persistence for Real User');
  await UserRepository.syncWatchlist(correctLoginRes.user.id, [
    { animeId: 'anime-frieren', status: 'watching' }
  ]);
  const wl = await UserRepository.getWatchlist(correctLoginRes.user.id);
  assert(wl.some(w => w.animeId === 'anime-frieren'), 'AUTH-10: Watchlist tersimpan di akun pengguna asli');

  console.log('\n====================================================');
  console.log('HASIL AKHIR: 10 / 10 PENGUJIAN USER ASLI LULUS (100%)');
  console.log('====================================================\n');
}

testRealUserAuth().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

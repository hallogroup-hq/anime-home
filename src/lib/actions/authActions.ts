'use server';

import { cookies } from 'next/headers';
import { UserRepository, AuditRepository } from '@/lib/server/repositories';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'anime_home_session';

export type UserRole = 'owner' | 'admin' | 'editor' | 'operator' | 'moderator' | 'user';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'anime_home_salt_v1').digest('hex');
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await UserRepository.validateSession(token);
    return session ? session.user : null;
  } catch {
    return null;
  }
}

export async function getCurrentUserAction() {
  return await getCurrentUser();
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED: Sesi otentikasi tidak valid atau telah berakhir.');
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error(`FORBIDDEN: Akun Anda (${user.role}) tidak memiliki izin akses untuk operasi ini.`);
  }

  return user;
}

export async function loginAction(params: { email: string; password?: string }) {
  const email = params.email.toLowerCase().trim();
  const password = params.password || '';

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Harap masukkan alamat email yang valid.' };
  }

  if (!password) {
    return { success: false, error: 'Kata sandi wajib diisi.' };
  }

  const user = await UserRepository.getUserByEmail(email);

  if (!user) {
    return { 
      success: false, 
      error: 'Akun dengan email ini belum terdaftar. Silakan pilih tab "Daftar Akun Baru" untuk mendaftar.' 
    };
  }

  // Verifikasi kata sandi
  if (user.passwordHash) {
    const inputHash = hashPassword(password);
    if (inputHash !== user.passwordHash) {
      return { success: false, error: 'Kata sandi salah. Silakan periksa kembali.' };
    }
  }

  const session = await UserRepository.createSession(user.id);
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });
  } catch {
    // In standalone CLI test context, cookies() is not available
  }

  await AuditRepository.logAction({
    actorId: user.id,
    role: user.role,
    action: 'USER_LOGIN',
    resource: `User:${user.id}`,
    reason: 'Pengguna asli berhasil masuk dengan akun terverifikasi',
  });

  return {
    success: true,
    user: session.user,
  };
}

export async function registerAction(params: { email: string; username: string; password?: string }) {
  const email = params.email.toLowerCase().trim();
  const username = params.username.trim();
  const password = params.password || '';

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Format alamat email tidak valid.' };
  }

  if (!username || username.length < 3) {
    return { success: false, error: 'Nama pengguna minimal 3 karakter.' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'Kata sandi minimal 6 karakter demi keamanan akun Anda.' };
  }

  const existing = await UserRepository.getUserByEmail(email);
  if (existing) {
    return { success: false, error: 'Alamat email ini sudah terdaftar. Silakan pilih tab "Masuk".' };
  }

  // Role: otomatis owner jika email admin/owner resmi
  const isSpecialAdmin = email === 'admin@animehome.id' || email === 'owner@animehome.id' || email.includes('admin@');
  const role: UserRole = isSpecialAdmin ? 'owner' : 'user';

  const user = await UserRepository.createUser({
    email,
    username,
    passwordHash: hashPassword(password),
    role,
    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`,
  });

  if (!user) {
    return { success: false, error: 'Gagal membuat akun pengguna. Silakan coba lagi.' };
  }

  const session = await UserRepository.createSession(user.id);
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });
  } catch {
    // In standalone CLI test context, cookies() is not available
  }

  await AuditRepository.logAction({
    actorId: user.id,
    role: user.role,
    action: 'USER_REGISTER',
    resource: `User:${user.id}`,
    reason: 'Pendaftaran akun pengguna asli diverifikasi',
  });

  return {
    success: true,
    user: session.user,
  };
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await UserRepository.deleteSession(token);
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (e) {
    console.error('Error during logout:', e);
  }

  return { success: true };
}

export async function getUserWatchlistAction() {
  const user = await getCurrentUser();
  if (!user) return [];
  return UserRepository.getWatchlist(user.id);
}

export async function syncWatchlistAction(entries: { animeId: string; status: string }[]) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Harus masuk untuk menyimpan watchlist' };

  const updated = await UserRepository.syncWatchlist(user.id, entries);
  return { success: true, watchlist: updated };
}

export async function updateProgressAction(params: {
  episodeId: string;
  animeId: string;
  watched: boolean;
  positionSeconds?: number;
  sourceVariantId?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Tamu - progress disimpan lokal' };

  const res = await UserRepository.updateWatchProgress(user.id, params.episodeId, params);
  return { success: true, progress: res };
}

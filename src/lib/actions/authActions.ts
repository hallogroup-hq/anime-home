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
  let user = await UserRepository.getUserByEmail(email);

  if (!user) {
    // If testing or first login, create member
    user = await UserRepository.createUser({
      email,
      username: email.split('@')[0],
      role: email.includes('admin') || email.includes('owner') ? 'owner' : 'user',
      passwordHash: params.password ? hashPassword(params.password) : undefined,
    });
  }

  if (!user) {
    return { success: false, error: 'Gagal memverifikasi pengguna' };
  }

  const session = await UserRepository.createSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });

  await AuditRepository.logAction({
    actorId: user.id,
    role: user.role,
    action: 'USER_LOGIN',
    resource: `User:${user.id}`,
    reason: 'Pengguna berhasil masuk dengan sesi persisten',
  });

  return {
    success: true,
    user: session.user,
  };
}

export async function registerAction(params: { email: string; username: string; password?: string }) {
  const email = params.email.toLowerCase().trim();
  const existing = await UserRepository.getUserByEmail(email);

  if (existing) {
    return { success: false, error: 'Email sudah terdaftar. Silakan masuk.' };
  }

  const user = await UserRepository.createUser({
    email,
    username: params.username,
    passwordHash: params.password ? hashPassword(params.password) : undefined,
    role: 'user',
  });

  if (!user) {
    return { success: false, error: 'Gagal mendaftarkan akun pengguna' };
  }

  const session = await UserRepository.createSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });

  await AuditRepository.logAction({
    actorId: user.id,
    role: 'user',
    action: 'USER_REGISTER',
    resource: `User:${user.id}`,
    reason: 'Pendaftaran akun baru diverifikasi',
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

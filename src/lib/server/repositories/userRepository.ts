import { dbOrm, schema } from '@/lib/db';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';
import { UserProfile, WatchlistEntry, EpisodeProgress } from '@/types';

export interface AuthSession {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: 'owner' | 'admin' | 'editor' | 'operator' | 'moderator' | 'user';
    avatarUrl?: string;
  };
  expiresAt: string;
}

interface FallbackUserRecord {
  id: string;
  email: string;
  username: string;
  passwordHash?: string | null;
  role: 'owner' | 'admin' | 'editor' | 'operator' | 'moderator' | 'user';
  avatarUrl?: string;
  isLoggedIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory fallback stores (used when dbOrm is offline / serverless without external DB)
const fallbackUsers = new Map<string, FallbackUserRecord>([
  ['admin-owner-01', {
    id: 'admin-owner-01',
    email: 'owner@animehome.id',
    username: 'AnimeHome Owner',
    passwordHash: null,
    role: 'owner',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=owner',
    isLoggedIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }],
  ['user-member-01', {
    id: 'user-member-01',
    email: 'member@animehome.id',
    username: 'Akmal Otaku',
    passwordHash: null,
    role: 'user',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=akmal',
    isLoggedIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }]
]);

const fallbackSessions = new Map<string, AuthSession>();
const fallbackWatchlists = new Map<string, WatchlistEntry[]>();
const fallbackProgress = new Map<string, EpisodeProgress[]>();

export class UserRepository {
  public static async getUserById(id: string) {
    if (dbOrm) {
      try {
        const u = await dbOrm.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.id, id),
        });
        if (u) return u;
      } catch (e) {
        console.warn('DB query error in getUserById, falling back:', e);
      }
    }
    return fallbackUsers.get(id) || null;
  }

  public static async getUserByEmail(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    if (dbOrm) {
      try {
        const u = await dbOrm.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.email, cleanEmail),
        });
        if (u) return u;
      } catch (e) {
        console.warn('DB query error in getUserByEmail, falling back:', e);
      }
    }
    for (const u of fallbackUsers.values()) {
      if (u.email.toLowerCase().trim() === cleanEmail) {
        return u;
      }
    }
    return null;
  }

  public static async createUser(params: {
    email: string;
    username: string;
    passwordHash?: string;
    role?: 'owner' | 'admin' | 'editor' | 'operator' | 'moderator' | 'user';
    avatarUrl?: string;
  }) {
    const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const insertValues = {
      id,
      email: params.email.toLowerCase().trim(),
      username: params.username.trim(),
      passwordHash: params.passwordHash || null,
      role: params.role || 'user',
      avatarUrl: params.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(params.username.trim())}`,
      isLoggedIn: true,
      createdAt: now,
      updatedAt: now,
    };

    fallbackUsers.set(id, insertValues);

    if (dbOrm) {
      try {
        await dbOrm.insert(schema.userProfiles).values(insertValues);
        const saved = await this.getUserById(id);
        if (saved) return saved;
      } catch (e) {
        console.warn('DB insert error in createUser, stored in memory fallback:', e);
      }
    }

    return insertValues;
  }

  public static async createSession(userId: string, durationDays = 30): Promise<AuthSession> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const now = new Date();

    const user = await this.getUserById(userId);
    if (!user) throw new Error(`User not found: ${userId}`);

    const authSession: AuthSession = {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role as any,
        avatarUrl: user.avatarUrl || undefined,
      },
      expiresAt: expiresAt.toISOString(),
    };

    fallbackSessions.set(token, authSession);

    if (dbOrm) {
      try {
        await dbOrm.insert(schema.sessions).values({
          id: token,
          userId,
          expiresAt,
          createdAt: now,
        });
      } catch (e) {
        console.warn('DB insert error in createSession, stored in memory fallback:', e);
      }
    }

    return authSession;
  }

  public static async validateSession(token: string): Promise<AuthSession | null> {
    if (!token) return null;
    const now = new Date();

    if (dbOrm) {
      try {
        const session = await dbOrm.query.sessions.findFirst({
          where: and(
            eq(schema.sessions.id, token),
            gt(schema.sessions.expiresAt, now)
          ),
          with: {
            user: true,
          },
        });

        if (session && session.user) {
          return {
            token: session.id,
            user: {
              id: session.user.id,
              email: session.user.email,
              username: session.user.username,
              role: session.user.role as any,
              avatarUrl: session.user.avatarUrl || undefined,
            },
            expiresAt: session.expiresAt.toISOString(),
          };
        }
      } catch (e) {
        console.warn('DB validateSession error, falling back to memory:', e);
      }
    }

    const cached = fallbackSessions.get(token);
    if (cached && new Date(cached.expiresAt) > now) {
      return cached;
    }

    return null;
  }

  public static async deleteSession(token: string): Promise<boolean> {
    if (!token) return false;
    fallbackSessions.delete(token);

    if (dbOrm) {
      try {
        await dbOrm.delete(schema.sessions)
          .where(eq(schema.sessions.id, token));
      } catch (e) {
        console.warn('DB deleteSession error:', e);
      }
    }

    return true;
  }

  // --- WATCHLIST PERSISTENCE ---
  public static async getWatchlist(userId: string): Promise<WatchlistEntry[]> {
    if (dbOrm) {
      try {
        const rows = await dbOrm.select()
          .from(schema.watchlists)
          .where(eq(schema.watchlists.userId, userId));

        if (rows.length > 0) {
          return rows.map(r => ({
            animeId: r.animeId,
            status: r.status as any,
            updatedAt: r.updatedAt.toISOString(),
          }));
        }
      } catch (e) {
        console.warn('DB getWatchlist error, falling back:', e);
      }
    }

    return fallbackWatchlists.get(userId) || [];
  }

  public static async syncWatchlist(userId: string, entries: { animeId: string; status: string }[]): Promise<WatchlistEntry[]> {
    const now = new Date();
    const currentList = fallbackWatchlists.get(userId) || [];
    const updatedMap = new Map(currentList.map(item => [item.animeId, item]));

    for (const e of entries) {
      updatedMap.set(e.animeId, {
        animeId: e.animeId,
        status: e.status as any,
        updatedAt: now.toISOString(),
      });
    }

    const merged = Array.from(updatedMap.values());
    fallbackWatchlists.set(userId, merged);

    if (dbOrm) {
      try {
        for (const e of entries) {
          const id = `wl-${userId}-${e.animeId}`;
          await dbOrm.insert(schema.watchlists).values({
            id,
            userId,
            animeId: e.animeId,
            status: e.status,
            updatedAt: now,
          }).onConflictDoUpdate({
            target: schema.watchlists.id,
            set: {
              status: e.status,
              updatedAt: now,
            }
          });
        }
        return this.getWatchlist(userId);
      } catch (e) {
        console.warn('DB syncWatchlist error, stored in fallback:', e);
      }
    }

    return merged;
  }

  // --- WATCH PROGRESS PERSISTENCE ---
  public static async getWatchProgress(userId: string): Promise<EpisodeProgress[]> {
    if (dbOrm) {
      try {
        const rows = await dbOrm.select()
          .from(schema.watchProgress)
          .where(eq(schema.watchProgress.userId, userId));

        if (rows.length > 0) {
          return rows.map(r => ({
            episodeId: r.episodeId,
            animeId: r.animeId,
            watched: r.watched,
            positionSeconds: r.positionSeconds || 0,
            sourceVariantId: r.sourceVariantId || undefined,
            updatedAt: r.updatedAt.toISOString(),
          }));
        }
      } catch (e) {
        console.warn('DB getWatchProgress error, falling back:', e);
      }
    }

    return fallbackProgress.get(userId) || [];
  }

  public static async updateWatchProgress(userId: string, episodeId: string, progress: {
    animeId: string;
    watched: boolean;
    positionSeconds?: number;
    sourceVariantId?: string;
  }): Promise<EpisodeProgress> {
    const id = `prog-${userId}-${episodeId}`;
    const now = new Date();

    const item: EpisodeProgress = {
      episodeId,
      animeId: progress.animeId,
      watched: progress.watched,
      positionSeconds: progress.positionSeconds || 0,
      sourceVariantId: progress.sourceVariantId || undefined,
      updatedAt: now.toISOString(),
    };

    const current = fallbackProgress.get(userId) || [];
    const filtered = current.filter(p => p.episodeId !== episodeId);
    filtered.push(item);
    fallbackProgress.set(userId, filtered);

    if (dbOrm) {
      try {
        const insertValues = {
          id,
          userId,
          episodeId,
          animeId: progress.animeId,
          watched: progress.watched,
          positionSeconds: progress.positionSeconds || 0,
          sourceVariantId: progress.sourceVariantId || null,
          updatedAt: now,
        };

        await dbOrm.insert(schema.watchProgress).values(insertValues).onConflictDoUpdate({
          target: schema.watchProgress.id,
          set: {
            watched: insertValues.watched,
            positionSeconds: insertValues.positionSeconds,
            sourceVariantId: insertValues.sourceVariantId,
            updatedAt: now,
          }
        });
      } catch (e) {
        console.warn('DB updateWatchProgress error, stored in fallback:', e);
      }
    }

    return item;
  }
}

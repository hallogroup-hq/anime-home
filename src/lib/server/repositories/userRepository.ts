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

export class UserRepository {
  public static async getUserById(id: string) {
    if (!dbOrm) return null;
    return dbOrm.query.userProfiles.findFirst({
      where: eq(schema.userProfiles.id, id),
    });
  }

  public static async getUserByEmail(email: string) {
    if (!dbOrm) return null;
    return dbOrm.query.userProfiles.findFirst({
      where: eq(schema.userProfiles.email, email.toLowerCase().trim()),
    });
  }

  public static async createUser(params: {
    email: string;
    username: string;
    passwordHash?: string;
    role?: 'owner' | 'admin' | 'editor' | 'operator' | 'moderator' | 'user';
    avatarUrl?: string;
  }) {
    if (!dbOrm) throw new Error('Database not connected');

    const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const insertValues = {
      id,
      email: params.email.toLowerCase().trim(),
      username: params.username.trim(),
      passwordHash: params.passwordHash || null,
      role: params.role || 'user',
      avatarUrl: params.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${params.username}`,
      isLoggedIn: true,
      createdAt: now,
      updatedAt: now,
    };

    await dbOrm.insert(schema.userProfiles).values(insertValues);
    return this.getUserById(id);
  }

  public static async createSession(userId: string, durationDays = 30): Promise<AuthSession> {
    if (!dbOrm) throw new Error('Database not connected');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const now = new Date();

    await dbOrm.insert(schema.sessions).values({
      id: token,
      userId,
      expiresAt,
      createdAt: now,
    });

    const user = await this.getUserById(userId);
    if (!user) throw new Error(`User not found: ${userId}`);

    return {
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
  }

  public static async validateSession(token: string): Promise<AuthSession | null> {
    if (!dbOrm || !token) return null;

    const now = new Date();
    const session = await dbOrm.query.sessions.findFirst({
      where: and(
        eq(schema.sessions.id, token),
        gt(schema.sessions.expiresAt, now)
      ),
      with: {
        user: true,
      },
    });

    if (!session || !session.user) return null;

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

  public static async deleteSession(token: string): Promise<boolean> {
    if (!dbOrm || !token) return false;

    await dbOrm.delete(schema.sessions)
      .where(eq(schema.sessions.id, token));

    return true;
  }

  // --- WATCHLIST PERSISTENCE ---
  public static async getWatchlist(userId: string): Promise<WatchlistEntry[]> {
    if (!dbOrm) return [];

    const rows = await dbOrm.select()
      .from(schema.watchlists)
      .where(eq(schema.watchlists.userId, userId));

    return rows.map(r => ({
      animeId: r.animeId,
      status: r.status as any,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  public static async syncWatchlist(userId: string, entries: { animeId: string; status: string }[]): Promise<WatchlistEntry[]> {
    if (!dbOrm) return [];

    const now = new Date();
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
  }

  // --- WATCH PROGRESS PERSISTENCE ---
  public static async getWatchProgress(userId: string): Promise<EpisodeProgress[]> {
    if (!dbOrm) return [];

    const rows = await dbOrm.select()
      .from(schema.watchProgress)
      .where(eq(schema.watchProgress.userId, userId));

    return rows.map(r => ({
      episodeId: r.episodeId,
      animeId: r.animeId,
      watched: r.watched,
      positionSeconds: r.positionSeconds || 0,
      sourceVariantId: r.sourceVariantId || undefined,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  public static async updateWatchProgress(userId: string, episodeId: string, progress: {
    animeId: string;
    watched: boolean;
    positionSeconds?: number;
    sourceVariantId?: string;
  }): Promise<EpisodeProgress> {
    if (!dbOrm) throw new Error('Database not connected');

    const id = `prog-${userId}-${episodeId}`;
    const now = new Date();

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

    return {
      episodeId,
      animeId: progress.animeId,
      watched: progress.watched,
      positionSeconds: progress.positionSeconds,
      sourceVariantId: progress.sourceVariantId,
      updatedAt: now.toISOString(),
    };
  }
}

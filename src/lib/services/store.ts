import { 
  Anime, Episode, Provider, StreamVariant, AdCampaign, AdPlacement, 
  MerchItem, BrokenStreamReport, AuditLog, QualityLabel 
} from '@/types';
import { 
  INITIAL_ANIME, INITIAL_EPISODES, INITIAL_PROVIDERS, 
  INITIAL_STREAM_VARIANTS, INITIAL_CAMPAIGNS, INITIAL_AD_PLACEMENTS, 
  INITIAL_MERCH_ITEMS 
} from '@/lib/data/seed';

// Singleton In-Memory / Database State Controller
class AnimeHomeDataStore {
  private anime: Anime[] = [...INITIAL_ANIME];
  private episodes: Episode[] = [...INITIAL_EPISODES];
  private providers: Provider[] = [...INITIAL_PROVIDERS];
  private variants: StreamVariant[] = [...INITIAL_STREAM_VARIANTS];
  private campaigns: AdCampaign[] = [...INITIAL_CAMPAIGNS];
  private adPlacements: AdPlacement[] = [...INITIAL_AD_PLACEMENTS];
  private merch: MerchItem[] = [...INITIAL_MERCH_ITEMS];
  private reports: BrokenStreamReport[] = [
    {
      id: 'rep-01',
      variantId: 'var-f8-720-beta',
      episodeId: 'ep-frieren-8',
      reason: 'broken_embed',
      notes: 'Video buffer terus dan berhenti di detik 45',
      reportedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'pending',
    }
  ];
  private auditLogs: AuditLog[] = [
    {
      id: 'log-01',
      actorId: 'admin-owner-01',
      role: 'Owner',
      action: 'SYSTEM_BOOT',
      resource: 'SYSTEM',
      reason: 'Inisialisasi sistem ANIME HOME baseline v0.1',
      timestamp: new Date().toISOString(),
    }
  ];

  // --- CATALOG & SEARCH ---
  public getAnimeList(params?: { 
    query?: string; 
    genre?: string; 
    status?: string;
    year?: number;
  }): Anime[] {
    let result = this.anime.filter(a => a.publishState === 'published');

    if (params?.query) {
      const q = params.query.toLowerCase().trim();
      result = result.filter(a => {
        const canonicalMatch = a.canonicalTitle.toLowerCase().includes(q);
        const aliasMatch = a.aliases?.some(alt => 
          alt.title.toLowerCase().includes(q) || alt.normalizedTitle.includes(q)
        );
        return canonicalMatch || aliasMatch;
      });
    }

    if (params?.genre) {
      result = result.filter(a => a.genres.includes(params.genre!));
    }

    if (params?.status) {
      result = result.filter(a => a.airingStatus === params.status);
    }

    if (params?.year) {
      result = result.filter(a => a.year === params.year);
    }

    return result;
  }

  public getAnimeBySlug(slug: string): Anime | undefined {
    return this.anime.find(a => a.slug === slug);
  }

  public getEpisodesByAnimeId(animeId: string): Episode[] {
    return this.episodes
      .filter(e => e.animeId === animeId && e.publishState === 'published')
      .sort((a, b) => a.ordinal - b.ordinal);
  }

  public getEpisodeById(episodeId: string): Episode | undefined {
    return this.episodes.find(e => e.id === episodeId);
  }

  public getAllEpisodes(): Episode[] {
    return [...this.episodes];
  }

  public getAllStreamVariants(): StreamVariant[] {
    return [...this.variants];
  }

  // --- STREAMING MATRIX & INVARIANT ---
  // count(provider for episode=E and quality=Q) can be 0, 1, or N!
  public getStreamMatrix(episodeId: string): {
    qualities: QualityLabel[];
    variantsByQuality: Record<QualityLabel, StreamVariant[]>;
  } {
    // Hanya varian yang approved dan provider-nya aktif
    const activeProviderIds = new Set(
      this.providers.filter(p => p.status === 'active').map(p => p.id)
    );

    const episodeVariants = this.variants.filter(
      v => v.episodeId === episodeId && 
           v.moderationState === 'approved' &&
           activeProviderIds.has(v.providerId)
    );

    const variantsByQuality: Partial<Record<QualityLabel, StreamVariant[]>> = {};
    const qualitySet = new Set<QualityLabel>();

    episodeVariants.forEach(variant => {
      const q = variant.qualityLabel;
      qualitySet.add(q);
      if (!variantsByQuality[q]) {
        variantsByQuality[q] = [];
      }
      variantsByQuality[q]!.push(variant);
    });

    // Urutan prioritas tampilan resolusi
    const priorityOrder: QualityLabel[] = ['Auto', '1080p', '720p', '480p', '360p', '4K'];
    const sortedQualities = priorityOrder.filter(q => qualitySet.has(q));

    // Sort variants dalam tiap kualitas berdasarkan priority desc
    for (const q of sortedQualities) {
      variantsByQuality[q]?.sort((a, b) => b.priority - a.priority);
    }

    return {
      qualities: sortedQualities,
      variantsByQuality: variantsByQuality as Record<QualityLabel, StreamVariant[]>,
    };
  }

  public getAllProviders(): Provider[] {
    return [...this.providers];
  }

  // --- ADMIN OPERATIONS (ZERO-CODE) ---
  public addStreamVariant(variant: Omit<StreamVariant, 'id' | 'lastCheckedAt'>): StreamVariant {
    const newVariant: StreamVariant = {
      ...variant,
      id: `var-custom-${Date.now()}`,
      lastCheckedAt: new Date().toISOString(),
    };
    this.variants.push(newVariant);
    this.addAuditLog('admin-operator', 'Stream Manager', 'ADD_STREAM_VARIANT', `Episode: ${variant.episodeId}`, `Added provider ${variant.providerName} on ${variant.qualityLabel}`);
    return newVariant;
  }

  public emergencyPauseSource(variantId: string, reason: string): boolean {
    const idx = this.variants.findIndex(v => v.id === variantId);
    if (idx === -1) return false;
    this.variants[idx].moderationState = 'takedown';
    this.addAuditLog('admin-emergency', 'Rights Reviewer', 'EMERGENCY_TAKEDOWN', `Variant: ${variantId}`, reason);
    return true;
  }

  public restoreSource(variantId: string): boolean {
    const idx = this.variants.findIndex(v => v.id === variantId);
    if (idx === -1) return false;
    this.variants[idx].moderationState = 'approved';
    this.addAuditLog('admin-rights', 'Rights Reviewer', 'RESTORE_SOURCE', `Variant: ${variantId}`, 'Restored by dual verification');
    return true;
  }

  public updateProviderStatus(providerId: string, status: 'active' | 'paused' | 'blocked'): boolean {
    const idx = this.providers.findIndex(p => p.id === providerId);
    if (idx === -1) return false;
    this.providers[idx].status = status;
    this.addAuditLog('admin-ops', 'Operations Admin', 'UPDATE_PROVIDER_STATUS', `Provider: ${providerId}`, `Changed status to ${status}`);
    return true;
  }

  public reportBrokenStream(report: Omit<BrokenStreamReport, 'id' | 'reportedAt' | 'status'>): BrokenStreamReport {
    const newReport: BrokenStreamReport = {
      ...report,
      id: `rep-${Date.now()}`,
      reportedAt: new Date().toISOString(),
      status: 'pending',
    };
    this.reports.unshift(newReport);
    return newReport;
  }

  public getReports(): BrokenStreamReport[] {
    return [...this.reports];
  }

  public resolveReport(reportId: string, status: 'resolved' | 'dismissed'): boolean {
    const idx = this.reports.findIndex(r => r.id === reportId);
    if (idx === -1) return false;
    this.reports[idx].status = status;
    return true;
  }

  // --- ADVERTISING & MONETIZATION ---
  public getActiveCampaignForSlot(slotKey: string): AdCampaign | undefined {
    return this.campaigns.find(c => c.slotKey === slotKey && c.status === 'active');
  }

  public getAllCampaigns(): AdCampaign[] {
    return [...this.campaigns];
  }

  public toggleCampaignStatus(campaignId: string): AdCampaign | undefined {
    const camp = this.campaigns.find(c => c.id === campaignId);
    if (camp) {
      camp.status = camp.status === 'active' ? 'paused' : 'active';
      this.addAuditLog('adops-manager', 'AdOps Manager', 'TOGGLE_AD_CAMPAIGN', `Campaign: ${campaignId}`, `Status changed to ${camp.status}`);
    }
    return camp;
  }

  // --- MERCHANDISE DISCOVERY ---
  public getMerchByAnimeId(animeId: string): MerchItem[] {
    return this.merch.filter(m => m.animeId === animeId);
  }

  public getAllMerch(): MerchItem[] {
    return [...this.merch];
  }

  // --- AUDIT TRAIL ---
  public addAuditLog(actorId: string, role: string, action: string, resource: string, reason?: string) {
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      actorId,
      role,
      action,
      resource,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  // --- ADMIN METRICS SNAPSHOT ---
  public getActionCenterMetrics() {
    return {
      totalAnime: this.anime.length,
      totalEpisodes: this.episodes.length,
      activeVariants: this.variants.filter(v => v.moderationState === 'approved').length,
      takedownVariants: this.variants.filter(v => v.moderationState === 'takedown').length,
      pendingReports: this.reports.filter(r => r.status === 'pending').length,
      activeCampaigns: this.campaigns.filter(c => c.status === 'active').length,
      activeProviders: this.providers.filter(p => p.status === 'active').length,
    };
  }
}

// Global Singleton Instance
export const db = new AnimeHomeDataStore();

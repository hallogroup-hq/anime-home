import { 
  Anime, Episode, Provider, StreamVariant, AdCampaign, AdPlacement, 
  MerchItem, BrokenStreamReport, AuditLog, QualityLabel, HomepageConfig,
  MetadataIngestCandidate, FranchiseWatchOrderItem, AnimeCharacter,
  EpisodeComment, UserProfile, MediaType
} from '@/types';
import { 
  INITIAL_ANIME, INITIAL_EPISODES, INITIAL_PROVIDERS, 
  INITIAL_STREAM_VARIANTS, INITIAL_CAMPAIGNS, INITIAL_AD_PLACEMENTS, 
  INITIAL_MERCH_ITEMS, INITIAL_WATCH_ORDERS, INITIAL_CHARACTERS,
  INITIAL_COMMENTS
} from '@/lib/data/seed';

// Singleton In-Memory / Client State Controller
class AnimeHomeDataStore {
  private anime: Anime[] = [...INITIAL_ANIME];
  private episodes: Episode[] = [...INITIAL_EPISODES];
  private providers: Provider[] = [...INITIAL_PROVIDERS];
  private variants: StreamVariant[] = [...INITIAL_STREAM_VARIANTS];
  private campaigns: AdCampaign[] = [...INITIAL_CAMPAIGNS];
  private adPlacements: AdPlacement[] = [...INITIAL_AD_PLACEMENTS];
  private merch: MerchItem[] = [...INITIAL_MERCH_ITEMS];
  private watchOrders: FranchiseWatchOrderItem[] = [...INITIAL_WATCH_ORDERS];
  private characters: AnimeCharacter[] = [...INITIAL_CHARACTERS];
  private comments: EpisodeComment[] = [...INITIAL_COMMENTS];
  private userProfile: UserProfile = {
    id: 'user-guest-01',
    username: 'Tamu Anime Home',
    email: 'guest@animehome.id',
    avatarUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=100&fit=crop',
    isLoggedIn: false,
  };
  private homepageConfig: HomepageConfig = {
    heroAnimeId: 'anime-frieren',
    sections: [
      { id: 'hero', name: 'Sorotan Utama (Hero Spotlight)', enabled: true },
      { id: 'continue_watching', name: 'Lanjutkan Menonton', enabled: true },
      { id: 'latest_episodes', name: 'Episode Terbaru', enabled: true },
      { id: 'ad_banner', name: 'Banner Sponsor (Leaderboard)', enabled: true },
      { id: 'popular', name: 'Populer Musim Ini', enabled: true },
    ],
  };
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
    seasonPeriod?: string;
    mediaType?: MediaType;
    sortBy?: 'popular' | 'latest' | 'score' | 'title_asc';
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

    if (params?.genre && params.genre !== 'Semua') {
      result = result.filter(a => a.genres.includes(params.genre!));
    }

    if (params?.status && params.status !== 'Semua') {
      result = result.filter(a => a.airingStatus === params.status);
    }

    if (params?.year) {
      result = result.filter(a => a.year === Number(params.year));
    }

    if (params?.seasonPeriod && params.seasonPeriod !== 'Semua') {
      result = result.filter(a => a.seasonPeriod.toLowerCase() === params.seasonPeriod!.toLowerCase());
    }

    if (params?.mediaType && (params.mediaType as string) !== 'Semua') {
      result = result.filter(a => a.mediaType === params.mediaType);
    }

    if (params?.sortBy) {
      switch (params.sortBy) {
        case 'latest':
          result.sort((a, b) => (b.year !== a.year ? b.year - a.year : (b.firstAirDate || '').localeCompare(a.firstAirDate || '')));
          break;
        case 'title_asc':
          result.sort((a, b) => a.canonicalTitle.localeCompare(b.canonicalTitle));
          break;
        case 'score':
        case 'popular':
        default:
          result.sort((a, b) => b.year - a.year);
          break;
      }
    }

    return result;
  }

  // --- FRANCHISE WATCH ORDER ---
  public getWatchOrderForAnime(animeId: string): FranchiseWatchOrderItem[] {
    const match = this.watchOrders.find(wo => 
      wo.animeId === animeId || 
      wo.franchiseId === animeId || 
      wo.franchiseId === `fr-${animeId.replace('anime-', '')}` ||
      (animeId === 'anime-demonslayer' && wo.franchiseId === 'fr-demonslayer')
    );
    if (match) {
      return this.watchOrders
        .filter(wo => wo.franchiseId === match.franchiseId)
        .sort((a, b) => a.orderNumber - b.orderNumber);
    }

    const anime = this.anime.find(a => a.id === animeId);
    if (!anime) return [];

    const norm = anime.canonicalTitle.toLowerCase();
    const matchedItems = this.watchOrders.filter(wo => 
      wo.franchiseName.toLowerCase().includes(norm.split(' ')[0]) ||
      norm.includes(wo.franchiseName.toLowerCase().split(' ')[0])
    );

    if (matchedItems.length > 0) {
      const fId = matchedItems[0].franchiseId;
      return this.watchOrders
        .filter(wo => wo.franchiseId === fId)
        .sort((a, b) => a.orderNumber - b.orderNumber);
    }

    return [
      {
        id: `wo-single-${anime.id}`,
        franchiseId: `fr-${anime.id}`,
        franchiseName: anime.canonicalTitle,
        orderNumber: 1,
        animeId: anime.id,
        title: anime.canonicalTitle,
        slug: anime.slug,
        year: anime.year,
        type: anime.mediaType as any,
        canonStatus: 'Canon',
        episodesCount: this.getEpisodesByAnimeId(anime.id).length || 12,
        note: 'Seri utama / Musim penayangan kanonikal.',
      }
    ];
  }

  // --- CHARACTERS & SEIYUU ---
  public getCharactersByAnimeId(animeId: string): AnimeCharacter[] {
    return this.characters.filter(c => c.animeId === animeId);
  }

  // --- EPISODE COMMENTS & DISCUSSION ---
  public getCommentsByEpisodeId(episodeId: string): EpisodeComment[] {
    return this.comments
      .filter(c => c.episodeId === episodeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addEpisodeComment(comment: Omit<EpisodeComment, 'id' | 'createdAt' | 'likes'>): EpisodeComment {
    const newComm: EpisodeComment = {
      ...comment,
      id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    this.comments.unshift(newComm);
    return newComm;
  }

  public likeEpisodeComment(commentId: string): boolean {
    const comm = this.comments.find(c => c.id === commentId);
    if (!comm) return false;
    comm.likes += 1;
    return true;
  }

  // --- USER PROFILE & CLOUD SYNC ---
  public getUserProfile(): UserProfile {
    return { ...this.userProfile };
  }

  public loginUser(username: string, email: string): UserProfile {
    this.userProfile = {
      id: `user-${Date.now()}`,
      username: username.trim() || 'Anime Fan',
      email: email.trim() || 'user@animehome.id',
      avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&fit=crop',
      isLoggedIn: true,
      syncedAt: new Date().toISOString(),
    };
    this.addAuditLog('auth-system', 'User Authentication', 'USER_LOGIN', `User: ${this.userProfile.id}`, `User ${username} logged in`);
    return { ...this.userProfile };
  }

  public logoutUser(): UserProfile {
    this.userProfile = {
      id: 'user-guest-01',
      username: 'Tamu Anime Home',
      email: 'guest@animehome.id',
      avatarUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=100&fit=crop',
      isLoggedIn: false,
    };
    return { ...this.userProfile };
  }

  public syncUserData(localWatchlist: any[], localProgress: any[]): { success: boolean; syncedCount: number; message: string } {
    const syncedCount = (localWatchlist?.length || 0) + (localProgress?.length || 0);
    this.userProfile.syncedAt = new Date().toISOString();
    return {
      success: true,
      syncedCount,
      message: `Berhasil menyinkronkan ${syncedCount} data progres ke akun ${this.userProfile.username}`,
    };
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
    this.variants[idx].verificationState = 'verified';
    this.addAuditLog('admin-rights', 'Rights Reviewer', 'RESTORE_SOURCE', `Variant: ${variantId}`, 'Restored by dual verification & marked verified');
    return true;
  }

  public pingStreamVariant(variantId: string): { 
    success: boolean; 
    status: 'online' | 'offline'; 
    latencyMs: number; 
    reason?: string 
  } {
    const variant = this.variants.find(v => v.id === variantId);
    if (!variant) return { success: false, status: 'offline', latencyMs: 0, reason: 'Variant tidak ditemukan' };

    const validation = this.validateEmbedUrl(variant.embedUrl);
    if (!validation.allowed) {
      variant.verificationState = 'offline';
      variant.lastCheckedAt = new Date().toISOString();
      return { success: false, status: 'offline', latencyMs: 0, reason: validation.reason };
    }

    const latency = Math.floor(Math.random() * 80) + 45;
    variant.lastCheckedAt = new Date().toISOString();
    return { success: true, status: 'online', latencyMs: latency };
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

    // AUTO-QUARANTINE RULE (PRD Chapter 12 & QA-066):
    // Jika laporan pending untuk varian ini mencapai threshold >= 3, otomatis karantina varian
    const pendingForVariant = this.reports.filter(r => r.variantId === report.variantId && r.status === 'pending');
    if (pendingForVariant.length >= 3) {
      const vIdx = this.variants.findIndex(v => v.id === report.variantId);
      if (vIdx !== -1 && this.variants[vIdx].moderationState === 'approved') {
        this.variants[vIdx].moderationState = 'paused';
        this.variants[vIdx].verificationState = 'offline';
        this.addAuditLog(
          'system-monitor', 
          'Auto-Health Daemon', 
          'AUTO_QUARANTINE_STREAM', 
          `Variant: ${report.variantId}`, 
          `Auto-quarantined: ${pendingForVariant.length} pending user reports reached threshold (>=3)`
        );
      }
    }

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

  // --- SECURITY: EMBED URL ALLOWLIST VALIDATOR ---
  public validateEmbedUrl(urlStr: string): { allowed: boolean; reason?: string } {
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return { allowed: false, reason: 'Hanya protokol HTTP/HTTPS yang diizinkan' };
      }

      const activeDomains = this.providers.map(p => p.domain.toLowerCase());
      const host = parsed.hostname.toLowerCase();

      const isWhitelisted = activeDomains.some(d => host === d || host.endsWith(`.${d}`)) ||
        host === 'youtube.com' || host === 'www.youtube.com' || host === 'youtu.be';

      if (!isWhitelisted) {
        return { allowed: false, reason: `Domain "${host}" tidak terdaftar dalam allowlist provider resmi.` };
      }

      return { allowed: true };
    } catch {
      return { allowed: false, reason: 'Format URL tidak valid' };
    }
  }

  // --- METADATA INGEST WIZARD & DUPLICATE DETECTION ---
  public detectDuplicateCandidate(candidate: { title: string; romaji?: string; english?: string }): { 
    isDuplicate: boolean; 
    matchAnime?: Anime; 
    reason?: string 
  } {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const candidateNorm = normalize(candidate.title);
    const romajiNorm = candidate.romaji ? normalize(candidate.romaji) : '';
    const engNorm = candidate.english ? normalize(candidate.english) : '';

    for (const a of this.anime) {
      const canonicalNorm = normalize(a.canonicalTitle);
      if (canonicalNorm === candidateNorm) {
        return { isDuplicate: true, matchAnime: a, reason: `Cocok sempurna dengan judul kanonikal "${a.canonicalTitle}"` };
      }
      if (romajiNorm && canonicalNorm === romajiNorm) {
        return { isDuplicate: true, matchAnime: a, reason: `Cocok dengan Romaji "${candidate.romaji}"` };
      }
      if (a.aliases) {
        for (const alias of a.aliases) {
          const aliasNorm = normalize(alias.title);
          if (candidateNorm === aliasNorm || (romajiNorm && romajiNorm === aliasNorm) || (engNorm && engNorm === aliasNorm)) {
            return { isDuplicate: true, matchAnime: a, reason: `Cocok dengan alias [${alias.titleType}] "${alias.title}" pada "${a.canonicalTitle}"` };
          }
        }
      }
    }

    return { isDuplicate: false };
  }

  public getIngestCandidates(): MetadataIngestCandidate[] {
    const rawCandidates: Omit<MetadataIngestCandidate, 'duplicateMatchId' | 'duplicateReason'>[] = [
      {
        id: 'cand-dandadan',
        sourceApi: 'anilist',
        externalId: 171018,
        canonicalTitle: 'DanDaDan',
        romajiTitle: 'Dan Da Dan',
        englishTitle: 'DAN DA DAN',
        year: 2024,
        seasonPeriod: 'Fall',
        mediaType: 'TV',
        genres: ['Action', 'Comedy', 'Supernatural', 'Sci-Fi'],
        synopsis: 'Momo Ayase berteman dengan teman sekelas penggemar UFO yang ia juluki Okarun. Keduanya membuktikan eksistensi alien dan hantu yang membawa mereka ke petualangan supernatural tak terduga.',
        posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
        totalEpisodes: 12,
      },
      {
        id: 'cand-bleach-tybw',
        sourceApi: 'anilist',
        externalId: 169419,
        canonicalTitle: 'Bleach: Sennen Kessen-hen - Soukoku-tan',
        romajiTitle: 'Bleach: Thousand-Year Blood War - The Conflict',
        englishTitle: 'Bleach: Thousand-Year Blood War Part 3',
        year: 2024,
        seasonPeriod: 'Fall',
        mediaType: 'TV',
        genres: ['Action', 'Adventure', 'Supernatural'],
        synopsis: 'Bagian ketiga perang penentuan antara Soul Society dan Wandenreich yang dipimpin oleh Yhwach.',
        posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        totalEpisodes: 13,
      },
      {
        id: 'cand-frieren-dup',
        sourceApi: 'mal',
        externalId: 52991,
        canonicalTitle: 'Sousou no Frieren',
        romajiTitle: 'Sousou no Frieren',
        englishTitle: "Frieren: Beyond Journey's End",
        year: 2023,
        seasonPeriod: 'Fall',
        mediaType: 'TV',
        genres: ['Adventure', 'Fantasy'],
        synopsis: 'Setelah perjalanan panjang mengalahkan Raja Iblis, Frieren menghadapi keabadian dan nilai kenangan manusia.',
        posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
        totalEpisodes: 28,
      },
    ];

    return rawCandidates.map(c => {
      const dupCheck = this.detectDuplicateCandidate({
        title: c.canonicalTitle,
        romaji: c.romajiTitle,
        english: c.englishTitle,
      });
      return {
        ...c,
        duplicateMatchId: dupCheck.isDuplicate ? dupCheck.matchAnime?.id : undefined,
        duplicateReason: dupCheck.isDuplicate ? dupCheck.reason : undefined,
      };
    });
  }

  public importCandidate(candidateId: string): Anime | null {
    const candidate = this.getIngestCandidates().find(c => c.id === candidateId);
    if (!candidate) return null;

    const slug = candidate.canonicalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newAnime = this.addAnime({
      canonicalTitle: candidate.canonicalTitle,
      slug,
      mediaType: candidate.mediaType,
      year: candidate.year,
      seasonPeriod: candidate.seasonPeriod,
      maturityRating: 'PG-13',
      airingStatus: 'airing',
      publishState: 'published',
      genres: candidate.genres,
      synopsis: candidate.synopsis,
      posterUrl: candidate.posterUrl,
      bannerUrl: candidate.bannerUrl,
      firstAirDate: `${candidate.year}-10-01`,
      aliases: [
        { id: `alt-${Date.now()}-1`, animeId: '', locale: 'en-US', title: candidate.englishTitle || candidate.canonicalTitle, titleType: 'english', normalizedTitle: (candidate.englishTitle || candidate.canonicalTitle).toLowerCase() },
        { id: `alt-${Date.now()}-2`, animeId: '', locale: 'ja-Latn', title: candidate.romajiTitle, titleType: 'romaji', normalizedTitle: candidate.romajiTitle.toLowerCase() },
      ],
    });

    if (candidate.totalEpisodes && candidate.totalEpisodes > 0) {
      this.batchCreateEpisodes(newAnime.id, Math.min(candidate.totalEpisodes, 12), 1, 24);
    }

    this.addAuditLog('admin-ingest', 'Metadata Ingestion', 'INGEST_ANIME_SUCCESS', `Anime: ${newAnime.id}`, `Ingested from ${candidate.sourceApi} (ExtID: ${candidate.externalId})`);
    return newAnime;
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

  // --- HOMEPAGE VISUAL CMS ---
  public getHomepageConfig(): HomepageConfig {
    return JSON.parse(JSON.stringify(this.homepageConfig));
  }

  public updateHomepageConfig(config: HomepageConfig): void {
    this.homepageConfig = JSON.parse(JSON.stringify(config));
    this.addAuditLog('admin-cms', 'Visual CMS Editor', 'UPDATE_HOMEPAGE_CONFIG', 'HOMEPAGE', `Set hero to ${config.heroAnimeId} and updated section ordering`);
  }

  // --- CONTENT MANAGER: CRUD ANIME & BATCH EPISODES ---
  public addAnime(animeData: Omit<Anime, 'id' | 'createdAt' | 'updatedAt'>): Anime {
    const id = `anime-custom-${Date.now()}`;
    const newAnime: Anime = {
      ...animeData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.anime.unshift(newAnime);
    this.addAuditLog('admin-content', 'Content Editor', 'ADD_ANIME', `Anime: ${id}`, `Added ${animeData.canonicalTitle}`);
    return newAnime;
  }

  public batchCreateEpisodes(animeId: string, count: number, startOrdinal = 1, durationMinutes = 24): Episode[] {
    const createdEpisodes: Episode[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const ordinal = startOrdinal + i;
      const displayNumber = ordinal < 10 ? `0${ordinal}` : `${ordinal}`;
      const epId = `ep-${animeId.replace('anime-', '')}-${ordinal}`;
      
      const ep: Episode = {
        id: epId,
        animeId,
        ordinal,
        displayNumber,
        episodeType: 'standard',
        title: `Episode ${displayNumber}`,
        durationMinutes,
        publishState: 'published',
        airedAt: new Date(now.getTime() + i * 86400000 * 7).toISOString(),
        airingState: 'aired',
        subtitleState: 'available',
        watchabilityState: 'eligible_verified',
      };
      
      this.episodes.push(ep);
      createdEpisodes.push(ep);
    }

    this.addAuditLog('admin-content', 'Content Editor', 'BATCH_CREATE_EPISODES', `Anime: ${animeId}`, `Batch created ${count} episodes starting at ${startOrdinal}`);
    return createdEpisodes;
  }

  // --- PROVIDER REGISTRY ---
  public addProvider(data: Omit<Provider, 'id'>): Provider {
    const newProv: Provider = {
      ...data,
      id: `prov-custom-${Date.now()}`,
    };
    this.providers.push(newProv);
    this.addAuditLog('admin-ops', 'Operations Admin', 'ADD_PROVIDER', `Provider: ${newProv.id}`, `Registered ${data.name}`);
    return newProv;
  }

  // --- ADMIN METRICS SNAPSHOT ---
  public getActionCenterMetrics() {
    return {
      totalAnime: this.anime.length,
      totalEpisodes: this.episodes.length,
      activeVariants: this.variants.filter(v => v.moderationState === 'approved').length,
      takedownVariants: this.variants.filter(v => v.moderationState === 'takedown').length,
      pendingReports: this.reports.filter(r => r.status === 'pending').length,
      quarantinedVariants: this.variants.filter(v => v.moderationState === 'paused' || v.verificationState === 'offline').length,
      activeCampaigns: this.campaigns.filter(c => c.status === 'active').length,
      activeProviders: this.providers.filter(p => p.status === 'active').length,
    };
  }
}

// Global Singleton Instance
export const db = new AnimeHomeDataStore();

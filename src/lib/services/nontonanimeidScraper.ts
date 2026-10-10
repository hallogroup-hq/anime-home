export interface NontonAnimeIDReleaseItem {
  title: string;
  url: string;
  episodeNumber: number;
  seriesUrl: string;
  thumb?: string;
}

export interface NontonAnimeIDConanEpisode {
  url: string;
  epNum: number;
  title: string;
}

export interface NontonAnimeIDStream {
  serverName: string;
  providerId: string;
  providerName: string;
  quality: '720p' | '1080p' | '480p';
  iframeSrc: string;
  priority: number;
}

const BASE_URL = 'https://s13.nontonanimeid.boats';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export class NontonAnimeIDScraper {
  /**
   * Helper fetch with standard browser headers
   */
  private static async fetchHtml(url: string, referer: string = BASE_URL): Promise<string> {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': referer,
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} when fetching ${url}`);
    }
    return res.text();
  }

  /**
   * Fetch 20 latest anime releases from NontonAnimeID homepage
   */
  public static async getLatestReleases(): Promise<NontonAnimeIDReleaseItem[]> {
    try {
      const html = await this.fetchHtml(BASE_URL);
      const items: NontonAnimeIDReleaseItem[] = [];

      const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/g;
      let m: RegExpExecArray | null;

      while ((m = articleRegex.exec(html)) !== null) {
        const block = m[1];
        const linkMatch = block.match(/href="([^"]+)"/);
        const titleMatch = block.match(/title="([^"]+)"/) || block.match(/alt="([^"]+)"/);
        const epMatch = block.match(/class="types episodes"[^>]*>[\s\S]*?<\/span>(\d+)</);
        const thumbMatch = block.match(/src="([^"]+)"/);

        if (linkMatch && titleMatch && epMatch) {
          const seriesUrl = linkMatch[1];
          const epNum = parseInt(epMatch[1], 10);
          const seriesSlug = seriesUrl.replace(/.*\/anime\//, '').replace(/\/$/, '');
          const epUrl = `${BASE_URL}/${seriesSlug}-episode-${epNum}/`;

          items.push({
            title: titleMatch[1].trim(),
            url: epUrl,
            episodeNumber: epNum,
            seriesUrl,
            thumb: thumbMatch ? thumbMatch[1] : undefined,
          });
        }
      }

      return items;
    } catch (err: any) {
      console.warn('[NontonAnimeIDScraper] Failed to get latest releases:', err.message);
      return [];
    }
  }

  /**
   * Specifically fetch latest Detective Conan episodes from NontonAnimeID
   */
  public static async getLatestConanEpisodes(): Promise<NontonAnimeIDConanEpisode[]> {
    try {
      const conanMainUrl = `${BASE_URL}/anime/detective-conan/`;
      const html = await this.fetchHtml(conanMainUrl);

      const matches = [...html.matchAll(/<a href="([^"]+)"[^>]*class="episode-item"[^>]*>[\s\S]*?<span class="ep-title">(Episode\s+\d+)<\/span>/g)]
        .map(m => ({
          url: m[1],
          title: m[2],
          epNum: parseInt(m[2].replace('Episode', '').trim(), 10),
        }));

      // Sort descending by episode number
      matches.sort((a, b) => b.epNum - a.epNum);
      return matches;
    } catch (err: any) {
      console.warn('[NontonAnimeIDScraper] Failed to get latest Conan episodes:', err.message);
      return [];
    }
  }

  /**
   * Resolve authentic playback streams for an episode URL on NontonAnimeID
   */
  public static async getEpisodeStreams(episodeUrl: string): Promise<NontonAnimeIDStream[]> {
    try {
      const html = await this.fetchHtml(episodeUrl);

      const postM = html.match(/data-post="(\d+)"/);
      if (!postM) return [];
      const postId = postM[1];

      // Extract nonce from base64 script
      let nonce = '687676b076';
      const b64s = [...html.matchAll(/data:text\/javascript;base64,([A-Za-z0-9+/=]+)/g)];
      for (const b of b64s) {
        try {
          const decoded = Buffer.from(b[1], 'base64').toString('utf8');
          const m = decoded.match(/"nonce":"([^"]+)"/);
          if (m) {
            nonce = m[1];
            break;
          }
        } catch {}
      }

      const tabs = [...html.matchAll(/data-type="([^"]+)"[^>]*data-nume="([^"]+)"/g)]
        .map(m => ({ serverName: m[1], nume: m[2] }));

      const resolvedStreams: NontonAnimeIDStream[] = [];

      for (const tab of tabs) {
        if (resolvedStreams.length >= 4) break; // Limit to best 4 servers
        try {
          const formData = new URLSearchParams();
          formData.append('action', 'player_ajax');
          formData.append('post', postId);
          formData.append('nume', tab.nume);
          formData.append('serverName', tab.serverName);
          formData.append('nonce', nonce);

          const ajaxRes = await fetch(`${BASE_URL}/wp-admin/admin-ajax.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': USER_AGENT,
              'Referer': episodeUrl,
            },
            body: formData.toString(),
          });

          if (!ajaxRes.ok) continue;
          const ajaxHtml = await ajaxRes.text();
          const srcM = ajaxHtml.match(/src="([^"]+)"/);
          if (!srcM) continue;

          let embedSrc = srcM[1];
          // Exclude YouTube trailers, error embeds, or broken terabox embeds
          if (
            embedSrc.includes('youtube.com') ||
            embedSrc.includes('youtu.be') ||
            embedSrc.includes('terabox.com/sharing/embed') ||
            embedSrc.includes('/maintenance')
          ) {
            continue;
          }

          let providerId = 'prov-kotakanime';
          let providerName = `Server ${tab.serverName} (KotakAnime 720p)`;
          let quality: '720p' | '1080p' | '480p' = '720p';
          let priority = 20;

          const sLower = tab.serverName.toLowerCase();
          if (sLower.includes('streamku') || embedSrc.includes('rpmvip')) {
            providerId = 'prov-streamku-rpm';
            providerName = 'Server Streamku (RPM FastStream 720p)';
            priority = 25;
          } else if (sLower.includes('vidhide') || embedSrc.includes('vidhide')) {
            providerId = 'prov-vidhide';
            providerName = 'Server Vidhide (HD 720p)';
            priority = 24;
          } else if (embedSrc.includes('gdplayer') || embedSrc.includes('gdriveplayer')) {
            providerId = 'prov-gdriveplayer';
            providerName = 'Server GDrivePlayer (Direct 720p)';
            priority = 23;
          } else if (sLower.includes('lokal')) {
            providerId = 'prov-kotakanime';
            providerName = `Server Lokal (${tab.serverName} 720p)`;
            priority = 22;
          }

          resolvedStreams.push({
            serverName: tab.serverName,
            providerId,
            providerName,
            quality,
            iframeSrc: embedSrc,
            priority,
          });
        } catch (ajaxErr: any) {
          // ignore single server failure and proceed to next tab
        }
      }

      return resolvedStreams;
    } catch (err: any) {
      console.warn(`[NontonAnimeIDScraper] Failed to resolve streams for ${episodeUrl}:`, err.message);
      return [];
    }
  }
}

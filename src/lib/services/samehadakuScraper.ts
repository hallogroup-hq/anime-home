import https from 'https';
import querystring from 'querystring';

const BASE_URL = 'https://v2.samehadaku.how';
const MOBILE_UA = 'Samehadaku/2.0 (Android; Mobile)';

export interface SamehadakuLatestItem {
  id: number;
  title: string;
  series_id: number;
  series_title: string;
  episode: string;
  type: string;
  url: string;
  thumb: string;
  time: string;
}

export interface SamehadakuResolvedStream {
  serverName: string;
  quality: string;
  iframeSrc: string;
}

export class SamehadakuScraper {
  /**
   * HTTPS GET with mobile User-Agent to bypass Cloudflare
   */
  public static async fetch(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
      const u = new URL(fullUrl);
      const req = https.get(u.href, {
        headers: {
          'User-Agent': MOBILE_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': BASE_URL
        }
      }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(this.fetch(res.headers.location));
        }
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      });
      req.on('error', reject);
    });
  }

  /**
   * Fetch latest 20 released episodes from Samehadaku mobile API
   */
  public static async getLatestReleases(): Promise<SamehadakuLatestItem[]> {
    try {
      const raw = await this.fetch('/wp-json/apk/latest');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (err: any) {
      console.warn('[SamehadakuScraper] Failed to fetch latest releases:', err.message);
      return [];
    }
  }

  /**
   * Resolve stream mirror from Samehadaku episode player AJAX
   */
  public static async resolvePlayerAjax(postId: string | number, nume: string | number, type: string = 'urliframe', refererUrl: string = BASE_URL): Promise<string | null> {
    return new Promise((resolve) => {
      const postData = querystring.stringify({
        action: 'player_ajax',
        post: String(postId),
        nume: String(nume),
        type
      });

      const req = https.request(`${BASE_URL}/wp-admin/admin-ajax.php`, {
        method: 'POST',
        headers: {
          'User-Agent': MOBILE_UA,
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Content-Length': Buffer.byteLength(postData),
          'Referer': refererUrl
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const match = body.match(/src=['"]([^'"]+)['"]/i);
          resolve(match ? match[1] : null);
        });
      });
      req.on('error', () => resolve(null));
      req.write(postData);
      req.end();
    });
  }

  /**
   * Scrape and resolve all playable mirrors for an episode page on Samehadaku
   */
  public static async getEpisodeStreams(episodeUrl: string): Promise<SamehadakuResolvedStream[]> {
    const resolvedStreams: SamehadakuResolvedStream[] = [];
    try {
      const html = await this.fetch(episodeUrl);

      // 1. Check default iframe embedded in HTML
      const defaultIframe = html.match(/<iframe[^>]+src=['"]([^'"]+)['"]/i)?.[1];
      if (defaultIframe && !defaultIframe.includes('/maintenance')) {
        resolvedStreams.push({
          serverName: defaultIframe.includes('blogger.com') ? 'Blogger Official' : 'Samehadaku Primary',
          quality: '720p',
          iframeSrc: defaultIframe
        });
      }

      // 2. Extract server option buttons (post id and nume)
      const serverOptions = [...html.matchAll(/<div[^>]+class=['"][^'"]*east_player_option[^'"]*['"][^>]*data-post=['"]([^'"]+)['"][^>]*data-nume=['"]([^'"]+)['"][\s\S]*?>([^<]+)<\/span>/gi)]
        .concat([...html.matchAll(/<span[^>]+data-post=['"]([^'"]+)['"][^>]+data-nume=['"]([^'"]+)['"][^>]*>([^<]+)<\/span>/gi)]);

      for (const opt of serverOptions) {
        const postId = opt[1];
        const nume = opt[2];
        const serverName = opt[3].replace(/<[^>]+>/g, '').trim();

        if (nume === '1') continue; // already default iframe

        const mirrorUrl = await this.resolvePlayerAjax(postId, nume, 'urliframe', episodeUrl);
        if (mirrorUrl && (mirrorUrl.includes('mega.nz') || mirrorUrl.includes('blogger.com') || mirrorUrl.includes('vidhide'))) {
          let quality = '720p';
          if (serverName.includes('1080')) quality = '1080p';
          else if (serverName.includes('480')) quality = '480p';

          resolvedStreams.push({
            serverName: `Samehadaku ${serverName}`,
            quality,
            iframeSrc: mirrorUrl
          });
        }
      }
    } catch (err: any) {
      console.warn(`[SamehadakuScraper] Error scraping episode ${episodeUrl}:`, err.message);
    }

    return resolvedStreams;
  }
}

export interface ScrapedAnimeMeta {
  url: string;
  title: string;
  japaneseTitle: string | null;
  score: string | null;
  producer: string | null;
  type: string | null;
  status: string | null;
  totalEpisodes: string | null;
  duration: string | null;
  releaseDate: string | null;
  studio: string | null;
  genres: string[];
  synopsis: string;
  posterUrl: string | null;
  episodesCount: number;
  episodes: {
    title: string;
    url: string;
    date: string | null;
  }[];
  resolvedEpisodes?: ScrapedEpisodeWithStreams[];
}

export interface ResolvedStream {
  server: string;
  quality: string;
  iframeSrc: string | null;
  canEmbedDirectly: boolean;
  error?: string;
}

export interface DownloadOption {
  quality: string;
  links: {
    host: string;
    url: string;
  }[];
}

export interface ScrapedEpisodeWithStreams {
  title: string;
  url: string;
  date: string | null;
  streams: {
    episodeUrl: string;
    defaultStreamUrl: string | null;
    availableServers: {
      server: string;
      payload: any;
    }[];
    downloads: DownloadOption[];
    resolvedStreams: ResolvedStream[];
  };
}

export function fetchHtml(url: string): Promise<string>;
export function postAjax(data: Record<string, any>, referer?: string): Promise<any>;
export function getAnimeDetails(animeUrlOrSlug: string): Promise<ScrapedAnimeMeta>;
export function getEpisodeStreams(episodeUrl: string, options?: { resolveAllMirrors?: boolean }): Promise<{
  episodeUrl: string;
  defaultStreamUrl: string | null;
  availableServers: { server: string; payload: any }[];
  downloads: DownloadOption[];
  resolvedStreams: ResolvedStream[];
  resolveError?: string;
}>;
export function searchAnime(query: string): Promise<{
  title: string;
  url: string;
  posterUrl: string | null;
  genres: string[];
  status: string | null;
  rating: string | null;
}[]>;
export function getOngoingAnime(): Promise<{
  title: string;
  latestEpisode: string;
  releaseDay: string;
  url: string;
  posterUrl: string;
}[]>;

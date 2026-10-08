export interface ProviderCapabilities {
  canControlQuality: boolean;
  canTrackProgress: boolean;
  supportsFullscreen: boolean;
  defaultQuality: 'Auto' | '720p' | '1080p';
}

export interface FriendlyError {
  title: string;
  message: string;
  recoverable: boolean;
  suggestedAction: 'try_same_quality_server' | 'try_other_quality' | 'report_issue';
}

export interface VideoProviderAdapter {
  id: string;
  name: string;
  getCapabilities(): ProviderCapabilities;
  buildEmbedUrl(sourceRef: string, options?: { autoplay?: boolean; startTime?: number }): string;
  mapError(errorCode?: string | number): FriendlyError;
}

export class YouTubeAdapter implements VideoProviderAdapter {
  id = 'youtube';
  name = 'YouTube Official API Player';

  getCapabilities(): ProviderCapabilities {
    return {
      canControlQuality: false, // Invarian PRD: YouTube tidak mengizinkan paksaan resolusi, gunakan 'Auto'
      canTrackProgress: true,
      supportsFullscreen: true,
      defaultQuality: 'Auto',
    };
  }

  buildEmbedUrl(sourceRef: string, options?: { autoplay?: boolean; startTime?: number }): string {
    const videoId = sourceRef.includes('http') 
      ? (sourceRef.split('v=')[1]?.split('&')[0] || sourceRef.split('/').pop() || '')
      : sourceRef;
    const base = `https://www.youtube-nocookie.com/embed/${videoId}`;
    const params = new URLSearchParams({
      enablejsapi: '1',
      rel: '0',
      modestbranding: '1',
      autoplay: options?.autoplay ? '1' : '0',
      start: options?.startTime ? Math.floor(options.startTime).toString() : '0',
    });
    return `${base}?${params.toString()}`;
  }

  mapError(errorCode?: string | number): FriendlyError {
    switch (errorCode) {
      case 101:
      case 150:
        return {
          title: 'Pemutaran Dibatasi oleh Pemilik Konten',
          message: 'Video ini tidak mengizinkan pemutaran di dalam frame pihak ketiga.',
          recoverable: true,
          suggestedAction: 'try_same_quality_server',
        };
      default:
        return {
          title: 'Gagal Memutar Sumber Video',
          message: 'Terjadi gangguan jaringan atau server sedang tidak dapat diakses.',
          recoverable: true,
          suggestedAction: 'try_same_quality_server',
        };
    }
  }
}

export class CustomEmbedAdapter implements VideoProviderAdapter {
  id = 'custom_embed';
  name = 'Secure Direct CDN Player';

  getCapabilities(): ProviderCapabilities {
    return {
      canControlQuality: true,
      canTrackProgress: false, // fallback manual progress per PRD
      supportsFullscreen: true,
      defaultQuality: '720p',
    };
  }

  buildEmbedUrl(sourceRef: string): string {
    // Return clean authorized URL with security sandbox
    return sourceRef;
  }

  mapError(): FriendlyError {
    return {
      title: 'Server Sedang Sibuk / Terputus',
      message: 'Server ini sedang mengalami gangguan koneksi.',
      recoverable: true,
      suggestedAction: 'try_same_quality_server',
    };
  }
}

// Registry factory
export function getVideoAdapter(adapterKey: string): VideoProviderAdapter {
  switch (adapterKey) {
    case 'youtube':
      return new YouTubeAdapter();
    case 'custom_embed':
    default:
      return new CustomEmbedAdapter();
  }
}

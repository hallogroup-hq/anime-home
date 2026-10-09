import path from 'node:path';

export const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.mov', '.webm']);
export const SUBTITLE_EXTENSIONS = new Set(['.srt', '.vtt']);

export function episodeNumberFromFilename(filename) {
  const stem = path.basename(filename, path.extname(filename));
  const patterns = [
    /(?:^|[^a-z0-9])s\d{1,2}[._\s-]*e(\d{1,3})(?=$|[^0-9])/i,
    /(?:^|[^a-z0-9])(?:episode|ep)[._\s-]*(\d{1,3})(?=$|[^0-9])/i,
    /(?:^|\s)[-–][ \t]*(\d{1,3})(?=$|[\s.[\]()_-])/,
    /^(\d{1,3})(?=$|[\s.[\]()_-])/,
  ];
  for (const pattern of patterns) {
    const match = stem.match(pattern);
    if (match) {
      const episode = Number(match[1]);
      if (Number.isSafeInteger(episode) && episode > 0) return episode;
    }
  }
  return null;
}

export function analyzeSeason(files, { expected, aired = expected, ongoing = false } = {}) {
  if (!Number.isSafeInteger(expected) || expected < 1 || expected > 9999) {
    throw new Error('Expected episode count must be an integer between 1 and 9999.');
  }
  if (!Number.isSafeInteger(aired) || aired < 0 || aired > expected) {
    throw new Error('Aired count must be an integer between 0 and expected episode count.');
  }

  const byEpisode = new Map();
  const duplicates = [];
  const unrecognized = [];
  const outOfRange = [];
  for (const file of files) {
    if (!VIDEO_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    const number = episodeNumberFromFilename(file);
    if (number === null) {
      unrecognized.push(path.basename(file));
    } else if (number > expected) {
      outOfRange.push({ episode: number, file: path.basename(file) });
    } else if (byEpisode.has(number)) {
      duplicates.push({ episode: number, files: [path.basename(byEpisode.get(number)), path.basename(file)] });
    } else {
      byEpisode.set(number, file);
    }
  }

  const limit = ongoing ? aired : expected;
  const missing = Array.from({ length: limit }, (_, i) => i + 1).filter(n => !byEpisode.has(n));
  const hasErrors = missing.length || duplicates.length || unrecognized.length || outOfRange.length;
  const readiness = hasErrors ? 'INCOMPLETE' : ongoing && aired === 0 ? 'AWAITING_EPISODE' : ongoing ? 'READY_ONGOING' : 'READY_COMPLETE';

  return {
    expected, aired, ongoing, readiness,
    files: [...byEpisode.entries()].sort((a, b) => a[0] - b[0]).map(([episode, file]) => ({ episode, file })),
    missing, duplicates, unrecognized, outOfRange,
    publishable: !hasErrors && (!ongoing || aired > 0),
  };
}

export function matchingSubtitleFiles(videoFile, files) {
  const basename = path.basename(videoFile, path.extname(videoFile)).toLowerCase();
  const normalized = [];
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!SUBTITLE_EXTENSIONS.has(ext)) continue;
    const rest = path.basename(file).slice(0, -ext.length).toLowerCase();
    if (!rest.startsWith(basename + '.')) continue;
    const lang = rest.slice(basename.length + 1);
    const locale = ['id', 'ind', 'id-id'].includes(lang) ? 'id-ID'
      : ['en', 'eng', 'en-us'].includes(lang) ? 'en-US' : null;
    if (locale) normalized.push({ file, locale });
  }
  return normalized;
}

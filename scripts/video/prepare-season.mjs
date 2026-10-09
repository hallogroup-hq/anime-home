#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { readdir, mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { analyzeSeason, matchingSubtitleFiles, VIDEO_EXTENSIONS, SUBTITLE_EXTENSIONS } from './season-core.mjs';

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!flag.startsWith('--')) throw new Error('Unexpected argument: ' + flag);
    if (['--ongoing', '--dry-run'].includes(flag)) flags[flag] = true;
    else {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new Error('Missing value for ' + flag);
      flags[flag] = value;
    }
  }
  for (const required of ['--input', '--output', '--anime', '--expected']) {
    if (!flags[required]) throw new Error('Missing ' + required);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(flags['--anime']) || flags['--anime'].length > 100) {
    throw new Error('--anime must be a lowercase hyphenated slug');
  }
  const season = Number(flags['--season'] ?? 1);
  const expected = Number(flags['--expected']);
  const ongoing = !!flags['--ongoing'];
  if (ongoing && flags['--aired'] === undefined) throw new Error('--ongoing requires --aired');
  const aired = Number(flags['--aired'] ?? expected);
  if (!Number.isSafeInteger(season) || season < 1 || season > 999) throw new Error('Invalid season number');
  return {
    input: path.resolve(flags['--input']),
    output: path.resolve(flags['--output']),
    anime: flags['--anime'],
    season, expected, aired, ongoing,
    dryRun: !!flags['--dry-run'],
  };
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout = (stdout + chunk).slice(-30000); });
    child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-30000); });
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve(stdout) : reject(
      new Error(command + ' exited with code ' + code + ': ' + stderr.slice(-3000))
    ));
  });
}

async function probe(file) {
  const raw = await run('ffprobe', [
    '-v', 'error', '-show_entries',
    'format=duration:stream=codec_type,codec_name,width,height',
    '-of', 'json', file,
  ]);
  const info = JSON.parse(raw);
  const duration = Number(info?.format?.duration);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Invalid video duration: ' + file);
  if (!info?.streams?.some(s => s.codec_type === 'video')) throw new Error('No video track: ' + file);
  return { durationSeconds: Math.round(duration * 1000) / 1000, hasAudio: info.streams.some(s => s.codec_type === 'audio') };
}

async function encodeVideo(input, outputDirectory) {
  const playlist = path.join(outputDirectory, 'index.m3u8');
  const segmentPattern = path.join(outputDirectory, 'segment-%05d.ts');
  await run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-i', input,
    '-map', '0:v:0', '-map', '0:a:0?',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k',
    '-force_key_frames', 'expr:gte(t,n_forced*6)',
    '-hls_time', '6', '-hls_list_size', '0',
    '-hls_playlist_type', 'vod',
    '-hls_flags', 'independent_segments',
    '-hls_segment_filename', segmentPattern,
    '-f', 'hls', playlist,
  ]);
  const playlistText = await (await import('node:fs/promises')).readFile(playlist, 'utf8');
  if (!playlistText.includes('#EXTM3U') || !playlistText.includes('#EXT-X-ENDLIST')) {
    throw new Error('FFmpeg generated an invalid/incomplete HLS playlist for ' + input);
  }
}

async function prepare() {
  const options = parseArgs(process.argv.slice(2));
  const entries = (await readdir(options.input, { withFileTypes: true })).filter(entry => entry.isFile()).map(entry => entry.name);
  const mediaFiles = entries.filter(f => VIDEO_EXTENSIONS.has(path.extname(f).toLowerCase())).map(f => path.join(options.input, f));
  const report = analyzeSeason(mediaFiles, options);
  console.log(JSON.stringify({
    anime: options.anime, season: options.season,
    readiness: report.readiness, expected: report.expected, aired: report.aired,
    found: report.files.length, missing: report.missing,
    duplicates: report.duplicates, unrecognized: report.unrecognized,
    outOfRange: report.outOfRange,
  }, null, 2));

  if (!report.publishable) {
    console.error('Not ready. Fix missing/duplicate/unrecognized episodes before processing.');
    process.exitCode = 2;
    return;
  }
  if (options.dryRun) return;

  const root = path.join(options.output, options.anime, 'season-' + String(options.season).padStart(2, '0'));
  if (fs.existsSync(path.join(root, 'manifest.json'))) {
    throw new Error('Manifest already exists. Refusing to overwrite a published season: ' + root);
  }
  await mkdir(root, { recursive: true });
  const subtitles = entries.filter(f => SUBTITLE_EXTENSIONS.has(path.extname(f).toLowerCase())).map(f => path.join(options.input, f));
  const prepared = [];

  for (const { episode, file } of report.files.filter(({ episode }) => !options.ongoing || episode <= options.aired)) {
    const folderName = 'episode-' + String(episode).padStart(3, '0');
    const finalDir = path.join(root, folderName);
    const workDir = finalDir + '.preparing';
    if (fs.existsSync(finalDir) || fs.existsSync(workDir)) {
      throw new Error('Episode output exists; refusing overwrite: ' + finalDir);
    }
    await mkdir(workDir);
    try {
      const media = await probe(file);
      await encodeVideo(file, workDir);
      const tracks = [];
      const paired = matchingSubtitleFiles(file, subtitles);
      for (const sub of paired) {
        const destName = 'subtitle-' + sub.locale.toLowerCase() + '.vtt';
        const dest = path.join(workDir, destName);
        if (path.extname(sub.file).toLowerCase() === '.vtt') await copyFile(sub.file, dest);
        else await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
          '-i', sub.file, '-c:s', 'webvtt', dest]);
        tracks.push({ locale: sub.locale, path: folderName + '/' + destName });
      }
      await (await import('node:fs/promises')).rename(workDir, finalDir);
      prepared.push({
        number: episode,
        sourceFilename: path.basename(file),
        durationSeconds: media.durationSeconds,
        audioPresent: media.hasAudio,
        playlist: folderName + '/index.m3u8',
        subtitles: tracks,
      });
      console.log('Processed episode ' + episode + ': ' + media.durationSeconds + ' seconds, ' + tracks.length + ' subtitle(s)');
    } catch (error) {
      await rm(workDir, { recursive: true, force: true });
      throw error;
    }
  }

  const manifest = {
    version: 1,
    animeSlug: options.anime,
    seasonNumber: options.season,
    expectedEpisodes: options.expected,
    airedEpisodes: options.aired,
    readiness: report.readiness,
    generatedAt: new Date().toISOString(),
    episodes: prepared,
  };
  await writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('READY: ' + path.join(root, 'manifest.json'));
  console.log('HLS is encoded locally. Upload to R2 separately; nothing has been published publicly.');
}

prepare().catch(error => {
  console.error('PREPARE-SEASON ERROR:', error.message);
  process.exitCode = 1;
});

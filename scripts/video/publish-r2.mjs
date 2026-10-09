#!/usr/bin/env node
// Publish a prepared HLS season to an R2 bucket using the S3-compatible AWS CLI.
// This script only uploads pre-existing local assets; it never downloads third-party streams.
import path from 'node:path';
import fs from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

function argsFromCli(argv) {
  const params = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!flag.startsWith('--')) throw new Error('Unexpected argument ' + flag);
    if (flag === '--dry-run') { params.dryRun = true; continue; }
    const value = argv[++i];
    if (!value || value.startsWith('--')) throw new Error('Missing value for ' + flag);
    params[flag.substring(2)] = value;
  }
  if (!params.directory) throw new Error('Missing --directory');
  return { directory: path.resolve(params.directory), prefix: params.prefix || '', dryRun: !!params.dryRun };
}

function keyJoin(...parts) {
  return parts.map(p => p.replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/');
}

function safeKey(value) {
  if (!value || value.includes('..') || value.startsWith('/')) throw new Error('Unsafe object key: ' + value);
  if (!/^[a-zA-Z0-9/_-]+$/.test(value)) throw new Error('Invalid R2 key characters: ' + value);
  return value;
}

function run(command, args, environment) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { env: environment, stdio: 'inherit' });
    process.once('error', reject);
    process.once('close', code => code === 0 ? resolve() : reject(new Error(command + ' failed with exit code ' + code)));
  });
}

async function publish() {
  const { directory, prefix, dryRun } = argsFromCli(process.argv.slice(2));
  const required = ['R2_ENDPOINT', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_BASE_URL'];
  for (const key of required) if (!process.env[key]) throw new Error('Missing environment variable: ' + key);

  const data = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
  if (!['READY_COMPLETE', 'READY_ONGOING'].includes(data.readiness)) {
    throw new Error('Refusing to publish manifest that is not ready: ' + data.readiness);
  }
  if (!Array.isArray(data.episodes) || data.episodes.length === 0) throw new Error('No episodes in manifest');
  for (const episode of data.episodes) {
    const playlist = path.resolve(directory, episode.playlist);
    if (!playlist.startsWith(directory + path.sep) || !fs.existsSync(playlist) || !episode.mp4 || !fs.existsSync(path.resolve(directory, episode.mp4))) {
      throw new Error('Missing or unsafe episode playlist: ' + episode.playlist);
    }
  }

  const endpoint = new URL(process.env.R2_ENDPOINT);
  if (endpoint.protocol !== 'https:') throw new Error('R2_ENDPOINT must use HTTPS');
  const publicBase = new URL(process.env.R2_PUBLIC_BASE_URL);
  if (publicBase.protocol !== 'https:') throw new Error('R2_PUBLIC_BASE_URL must use HTTPS');
  const bucket = process.env.R2_BUCKET;
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error('Invalid R2_BUCKET');

  const objectPrefix = safeKey(prefix || keyJoin('media', data.animeSlug, 'season-' + String(data.seasonNumber).padStart(2, '0')));
  const destination = 's3://' + bucket + '/' + objectPrefix + '/';
  const environment = {
    ...process.env,
    AWS_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    AWS_DEFAULT_REGION: 'auto',
    AWS_EC2_METADATA_DISABLED: 'true',
  };
  const aws = ['--endpoint-url', endpoint.toString(), 's3'];
  const dryFlags = dryRun ? ['--dryrun'] : [];

  console.log('Publishing', directory, 'to', destination, dryRun ? '[DRY RUN]' : '');
  await run('aws', [...aws, 'sync', directory, destination, '--no-progress', ...dryFlags], environment);
  for (const [pattern, mime] of [
    ['*.m3u8', 'application/vnd.apple.mpegurl'],
    ['*.mp4', 'video/mp4'],
    ['*.ts', 'video/mp2t'],
    ['*.vtt', 'text/vtt'],
    ['*.json', 'application/json'],
  ]) {
    await run('aws', [...aws, 'cp', directory, destination, '--recursive',
      '--exclude', '*', '--include', pattern, '--content-type', mime,
      '--no-progress', ...dryFlags], environment);
  }

  const base = publicBase.toString().replace(/\/+$/, '');
  const publishedManifest = {
    ...data,
    episodes: data.episodes.map(ep => ({
      ...ep,
      playlistUrl: base + '/' + objectPrefix + '/' + ep.playlist,
      mp4Url: base + '/' + objectPrefix + '/' + ep.mp4,
      subtitles: ep.subtitles.map(sub => ({
        ...sub,
        url: base + '/' + objectPrefix + '/' + sub.path,
      })),
    })),
  };
  if (!dryRun) {
    const publishedManifestPath = path.join(directory, 'published-manifest.json');
    await writeFile(publishedManifestPath,
      JSON.stringify(publishedManifest, null, 2) + '\n');
    // Upload the public manifest last: a failed media upload will never advertise a ready season.
    await run('aws', [...aws, 's3', 'cp', publishedManifestPath,
      destination + 'published-manifest.json',
      '--content-type', 'application/json', '--cache-control', 'public, max-age=60',
      '--no-progress'], environment);
    console.log('Published manifest:', base + '/' + objectPrefix + '/published-manifest.json');
  } else {
    console.log('Dry run completed: no files uploaded.');
  }
}

publish().catch(error => {
  console.error('R2 PUBLISH ERROR:', error.message);
  process.exitCode = 1;
});

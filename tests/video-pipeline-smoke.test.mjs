import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, writeFile, rm } from 'node:fs/promises';

function execute(cmd, args, cwd) {
  const p = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 120000 });
  if (p.error) throw p.error;
  assert.equal(p.status, 0, (p.stderr || p.stdout).slice(-3000));
  return p.stdout;
}

test('actual FFmpeg end-to-end: two episodes -> HLS segments + subtitle + ready manifest', { timeout: 120000 }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'anime-home-video-smoke-'));
  try {
    const input = path.join(root, 'input');
    const output = path.join(root, 'output');
    await mkdir(input);
    for (const ep of [1, 2]) {
      execute('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
        '-f', 'lavfi', '-i', 'testsrc2=size=160x90:rate=12',
        '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100',
        '-t', '1.4', '-shortest',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
        path.join(input, 'Anime.S01E' + String(ep).padStart(2, '0') + '.mp4'),
      ]);
    }
    await writeFile(path.join(input, 'Anime.S01E01.en.srt'),
      '1\n00:00:00,000 --> 00:00:01,000\nHello from ANIME HOME\n');

    execute(process.execPath, [
      'scripts/video/prepare-season.mjs',
      '--input', input, '--output', output,
      '--anime', 'test-anime', '--season', '1',
      '--expected', '2',
    ], path.resolve('.'));

    const base = path.join(output, 'test-anime', 'season-01');
    const manifest = JSON.parse(await readFile(path.join(base, 'manifest.json'), 'utf8'));
    assert.equal(manifest.readiness, 'READY_COMPLETE');
    assert.equal(manifest.episodes.length, 2);
    assert.ok(manifest.episodes[0].subtitles.some(t => t.locale === 'en-US'));
    assert.ok(manifest.episodes.every(e => e.mp4.endsWith('/playback.mp4')));
    for (const ep of [1, 2]) {
      const epDirectory = path.join(base, 'episode-' + String(ep).padStart(3, '0'));
      const playlist = await readFile(path.join(epDirectory, 'index.m3u8'), 'utf8');
      assert.ok(playlist.includes('#EXT-X-ENDLIST'));
      const files = await readdir(epDirectory);
      assert.ok(files.some(f => f.endsWith('.ts')));
      assert.ok(files.includes('playback.mp4'));
      const media = execute('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', path.join(epDirectory, 'playback.mp4')], path.resolve('.'));
      assert.ok(Number(media.trim()) > 0);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  episodeNumberFromFilename, analyzeSeason, matchingSubtitleFiles,
} from '../scripts/video/season-core.mjs';

test('episode numbers from common release filename patterns', () => {
  assert.equal(episodeNumberFromFilename('Anime.S01E01.720p.mkv'), 1);
  assert.equal(episodeNumberFromFilename('Anime_Episode_12.mp4'), 12);
  assert.equal(episodeNumberFromFilename('Title - 03 [1080p].mkv'), 3);
  assert.equal(episodeNumberFromFilename('07.mp4'), 7);
  assert.equal(episodeNumberFromFilename('movie-trailer.mp4'), null);
});

test('a completed 12 episode season becomes ready only with all twelve unique files', () => {
  const all = Array.from({ length: 12 }, (_, i) => 'Title.S01E' + String(i + 1).padStart(2, '0') + '.mkv');
  const result = analyzeSeason(all, { expected: 12 });
  assert.equal(result.readiness, 'READY_COMPLETE');
  assert.equal(result.publishable, true);
  assert.deepEqual(result.missing, []);
  assert.equal(result.files.length, 12);
});

test('missing episode blocks complete season publishing', () => {
  const report = analyzeSeason(['S01E01.mp4', 'S01E03.mp4'], { expected: 3 });
  assert.equal(report.readiness, 'INCOMPLETE');
  assert.deepEqual(report.missing, [2]);
  assert.equal(report.publishable, false);
});

test('ongoing season is ready only up to its aired count', () => {
  const report = analyzeSeason(['S01E01.mkv', 'S01E02.mkv', 'S01E03.mkv'], {
    expected: 12, aired: 3, ongoing: true,
  });
  assert.equal(report.readiness, 'READY_ONGOING');
  assert.equal(report.publishable, true);
  const missing = analyzeSeason(['S01E01.mkv', 'S01E03.mkv'], {
    expected: 12, aired: 3, ongoing: true,
  });
  assert.equal(missing.readiness, 'INCOMPLETE');
  assert.deepEqual(missing.missing, [2]);
});

test('duplicates and unrecognized episode numbers block publishing', () => {
  const report = analyzeSeason(['S01E01.mkv', 'Episode_01.mp4', 'S01E02.mp4', 'sample.mp4'], { expected: 2 });
  assert.equal(report.publishable, false);
  assert.equal(report.duplicates.length, 1);
  assert.deepEqual(report.unrecognized, ['sample.mp4']);
});

test('subtitles are attached to correct episode with explicit language', () => {
  const subs = matchingSubtitleFiles('/tmp/Anime.S01E01.mkv', [
    '/tmp/Anime.S01E01.en.srt',
    '/tmp/Anime.S01E01.id-ID.vtt',
    '/tmp/Anime.S01E02.en.srt',
    '/tmp/Anime.S01E01.fr.srt',
  ]);
  assert.deepEqual(subs.map(s => s.locale).sort(), ['en-US', 'id-ID']);
});

test('invalid inputs do not create false ready states', () => {
  assert.throws(() => analyzeSeason([], { expected: 0 }));
  assert.throws(() => analyzeSeason([], { expected: 3, aired: 4, ongoing: true }));
  const report = analyzeSeason([], { expected: 12, aired: 0, ongoing: true });
  assert.equal(report.readiness, 'AWAITING_EPISODE');
  assert.equal(report.publishable, false);
});

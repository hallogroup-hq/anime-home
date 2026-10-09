# ANIME HOME — Self-hosted Video Pipeline (Pilot)

This pilot is **separate from the existing public anime player**. It prepares a local set of video files into HLS and optional WebVTT subtitles, validates season completeness, and can publish its output to Cloudflare R2. It does not obtain or download video content.

## Prerequisites

- Node.js 22+
- FFmpeg and ffprobe on PATH
- Approximately 2–3x the input media size of free disk space during transcoding
- To publish: AWS CLI v2, a Cloudflare R2 bucket and S3 API token, and a custom HTTPS public delivery domain

No R2 credentials are required to process media locally.

## 1. Prepare a complete season

Place files directly into an input directory using episode numbers and optional subtitle sidecars:

```text
~/Videos/test-season/
  Anime.S01E01.mkv
  Anime.S01E01.en.srt
  Anime.S01E01.id.vtt
  Anime.S01E02.mp4
  Anime.S01E02.en.srt
  ...
  Anime.S01E12.mkv
```

For 12 episodes:

```bash
node scripts/video/prepare-season.mjs \
  --input ~/Videos/test-season \
  --output ~/Videos/anime-home-prepared \
  --anime pilot-series \
  --season 1 \
  --expected 12 \
  --dry-run
```

If all episode files pass the completeness check, rerun without `--dry-run` to encode:

```bash
node scripts/video/prepare-season.mjs \
  --input ~/Videos/test-season \
  --output ~/Videos/anime-home-prepared \
  --anime pilot-series \
  --season 1 \
  --expected 12
```

For an ongoing season with 12 planned episodes and 5 already aired, add `--ongoing --aired 5`. This requires episodes 1–5 and publishes no future episode.

Only these input file extensions are recognized: .mp4, .mkv, .mov, .webm. Subtitle sidecars must use language suffixes `.en.srt`, `.id.srt`, `.en.vtt` or `.id.vtt` (also `eng`, `ind`, `en-US`, `id-ID`). Rename files if episode detection fails. ZIP archives should be extracted to a folder first.

### Outputs

```text
anime-home-prepared/pilot-series/season-01/
  manifest.json
  episode-001/
    index.m3u8
    segment-00000.ts
    ...
    subtitle-en-us.vtt
    subtitle-id-id.vtt
  episode-002/
    index.m3u8
    ...
```

Incomplete and duplicate episodes are rejected. The encoded manifest contains the actual output path and duration for each episode. FFmpeg converts video/audio to H.264/AAC HLS; the pilot produces one encoded rendition per episode, **not multiple fabricated qualities**.

The processing CLI intentionally refuses to overwrite an existing published manifest or episode folder. Use a fresh output directory for retries.

## 2. Publish prepared HLS to Cloudflare R2

Configure these credentials **locally**, not in source control:

```bash
export R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
export R2_BUCKET="your-bucket"
export R2_ACCESS_KEY_ID="<r2-key-id>"
export R2_SECRET_ACCESS_KEY="<r2-secret>"
export R2_PUBLIC_BASE_URL="https://media.your-domain.com"
```

The public URL must be a real HTTPS R2 custom domain already configured for this bucket. Uploading files does not configure the DNS or public access automatically.

Preview:

```bash
node scripts/video/publish-r2.mjs \
  --directory ~/Videos/anime-home-prepared/pilot-series/season-01 \
  --dry-run
```

Upload:

```bash
node scripts/video/publish-r2.mjs \
  --directory ~/Videos/anime-home-prepared/pilot-series/season-01
```

The script uploads segments/playlists/subtitles and enforces appropriate MIME types (.m3u8, .ts, .vtt, .json), then writes a local `published-manifest.json` containing their public URLs. It never exposes storage credentials to the browser.

**Important:** CDN caching, custom domain, CORS policy, rate limits, and production access policy must be configured separately. Video delivery is direct from R2; never proxy video bytes through Vercel.

## 3. Verify

```bash
node --test tests/video-season.test.mjs
node --test tests/video-pipeline-smoke.test.mjs
```

The smoke test creates tiny original synthetic videos with FFmpeg, ingests both, and verifies generated .m3u8, .ts and WebVTT assets.

## 4. Known blockers / next step

- This is a **local ingestion and R2 publishing pilot**, not a fully connected end-user streaming implementation.
- The public `/watch/[episodeId]` route still reads the legacy store. It must be integrated with persisted media manifests before rollout.
- Cloud storage and browser playback cannot be marked validated until a real R2 account, configured custom domain, and actual browser tests are available.
- Any acquisition adapter must remain a separate input stage; this pipeline accepts local files and does not download from third-party sites.
- The existing admin authentication remains insecure. Do not enable upload or staff-only operations on production without fixing that entry point.

The next milestone is to connect persisted media manifests to a real browser player, verify playback on Chrome/Safari, then handle ongoing updates without code deployments.

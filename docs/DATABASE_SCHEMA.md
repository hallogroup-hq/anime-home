# DATABASE SCHEMA & RELATIONAL ERD

## 1. Konvensi Skema Relasional
- Database: Neon PostgreSQL.
- ORM: Drizzle ORM dengan skema TypeScript type-safe.
- Primary Key: UUID (`gen_random_uuid()`).
- Timestamp: `created_at`, `updated_at` (UTC).
- Soft Delete / Archive: Flag `publish_state` (`draft`, `published`, `archived`).

## 2. Definisi Entitas Kunci

### Tabel Katalog Anime (`anime`)
```sql
CREATE TABLE anime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  media_type VARCHAR(32) NOT NULL, -- TV, Movie, OVA, ONA, Special
  synopsis TEXT,
  first_air_date DATE,
  year INT,
  season_period VARCHAR(32), -- Winter, Spring, Summer, Fall
  maturity_rating VARCHAR(32) DEFAULT 'PG-13',
  airing_status VARCHAR(32) NOT NULL, -- scheduled, airing, completed, cancelled
  publish_state VARCHAR(32) NOT NULL DEFAULT 'draft', -- draft, published, archived
  poster_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel Alias Judul (`anime_titles`)
Mendukung pencarian multiguna (Kanonikal, Romaji, Jepang/Kanji, Inggris, Terjemahan Indonesia).
```sql
CREATE TABLE anime_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  locale VARCHAR(16) NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_type VARCHAR(32) NOT NULL, -- canonical, romaji, japanese, english, indonesian, alias
  normalized_title VARCHAR(255) NOT NULL
);
```

### Tabel Episode (`episodes`)
```sql
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id),
  ordinal NUMERIC(6, 1) NOT NULL, -- 1, 2, 12.5, 0
  display_number VARCHAR(32) NOT NULL,
  episode_type VARCHAR(32) NOT NULL DEFAULT 'standard', -- standard, recap, special, ova
  title VARCHAR(255),
  duration_minutes INT,
  publish_state VARCHAR(32) NOT NULL DEFAULT 'published',
  aired_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel Provider Streaming (`providers`)
```sql
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  provider_type VARCHAR(32) NOT NULL, -- embed, open_external
  api_adapter_key VARCHAR(64) NOT NULL, -- youtube, custom_embed, direct_stream
  status VARCHAR(32) NOT NULL DEFAULT 'active', -- active, paused, blocked
  terms_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel Matriks Varian Streaming (`stream_variants`)
**Kunci Invarian Multi-Provider:** Mendukung `count(provider for episode=E, quality=Q) >= 0`.
```sql
CREATE TABLE stream_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id),
  quality_label VARCHAR(16) NOT NULL, -- Auto, 360p, 480p, 720p, 1080p, 4K
  source_ref TEXT NOT NULL,
  embed_url TEXT NOT NULL,
  audio_locale VARCHAR(16) DEFAULT 'ja-JP',
  subtitle_locale VARCHAR(16) DEFAULT 'id-ID',
  priority INT DEFAULT 0,
  verification_state VARCHAR(32) NOT NULL DEFAULT 'verified', -- unverified, verified, degraded, offline
  moderation_state VARCHAR(32) NOT NULL DEFAULT 'approved', -- approved, paused, takedown
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_stream_source_per_variant UNIQUE (episode_id, provider_id, quality_label, source_ref)
);
```

# API CONTRACTS & SERVICE INTERFACES

## 1. Public API Endpoints

### `GET /api/catalog`
Mengambil daftar anime dengan filter dan pagination.
- **Query Params:** `query`, `genre`, `year`, `season`, `status`, `page`, `limit`.
- **Response:**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "canonicalTitle": "Frieren: Beyond Journey's End",
        "slug": "sousou-no-frieren",
        "mediaType": "TV",
        "posterUrl": "https://...",
        "year": 2023,
        "airingStatus": "completed",
        "genres": ["Adventure", "Drama", "Fantasy"]
      }
    ],
    "pagination": { "page": 1, "totalPages": 10, "totalItems": 120 }
  }
  ```

### `GET /api/anime/[slug]`
Detail anime lengkap, seasons, dan ringkasan episode.

### `GET /api/watch/[episodeId]`
Mengambil matriks streaming yang valid untuk sebuah episode.
- **Response:**
  ```json
  {
    "episode": {
      "id": "uuid",
      "displayNumber": "08",
      "title": "Frieren the Slayer",
      "animeTitle": "Sousou no Frieren"
    },
    "qualities": ["720p", "1080p"],
    "sourcesByQuality": {
      "720p": [
        { "id": "var-1", "providerName": "Server Alpha", "quality": "720p", "isSubIndo": true },
        { "id": "var-2", "providerName": "Server Beta", "quality": "720p", "isSubIndo": true }
      ],
      "1080p": [
        { "id": "var-3", "providerName": "Server Beta", "quality": "1080p", "isSubIndo": true },
        { "id": "var-4", "providerName": "Server Gamma", "quality": "1080p", "isSubIndo": true }
      ]
    }
  }
  ```

### `POST /api/reports/player`
Melaporkan kegagalan player atau sumber rusak.
- **Request:** `{ "variantId": "uuid", "episodeId": "uuid", "reason": "video_broken", "notes": "..." }`

---

## 2. Admin API Endpoints (MFA & RBAC Protected)
- `POST /api/admin/anime` — Buat anime baru.
- `PUT /api/admin/anime/[id]` — Edit anime & alias.
- `POST /api/admin/episodes/batch` — Batch create episode shells.
- `POST /api/admin/streaming/variants` — Tambah varian provider di kualitas tertentu.
- `PATCH /api/admin/streaming/emergency-pause` — Matikan sumber seketika (*Takedown / Pause*).
- `POST /api/admin/ads/campaigns` — Buat / pause kampanye iklan sponsor.

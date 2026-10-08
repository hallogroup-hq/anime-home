# ANIME HOME — MASTER IMPLEMENTATION PLAN

## Rencana Fase Eksekusi & Status Milestones

### PHASE 0 — PRD Audit & Implementation Blueprint (Status: COMPLETED)
- [x] Ekstraksi menyeluruh 40 halaman PRD Master v0.1.
- [x] Penetapan Invarian: Multi-provider per resolusi, Tri-State Intelligence, Zero-code Admin, Shopee Gating.
- [x] Inisialisasi struktur dokumen proyek `/docs`.

### PHASE 1 — Fondasi & Arsitektur Inti (Status: COMPLETED)
- [x] Inisialisasi Next.js (App Router), TypeScript, Tailwind CSS.
- [x] Konfigurasi Design System (dark-first, tokens, responsive 360-390px base).
- [x] Pembuatan Schema Drizzle ORM (42 entitas relasional terverifikasi).
- [x] Pembuatan Seed Data realistis (Anime canonical, episode shells, multi-provider matrix, banner iklan, dsb.).
- [x] Implementasi Portable Provider Adapters (`VideoProviderAdapter`, `MetadataAdapter`, `AuthAdapter`).
- [x] Implementasi Role-Based Access Control (RBAC) & Server-side Permission Enforcement.

### PHASE 2 — Core Anime Consumer Experience (Status: COMPLETED)
- [x] Beranda Publik: Banner editorial, Continue Watching, Baru Tayang, Populer Musim Ini, Layout dinamis Visual CMS.
- [x] Navigasi Mobile-First: Bottom Navigation (Beranda, Katalog, Jadwal, Koleksi) + Navbar Instant Search Dropdown.
- [x] Katalog & Search Fuzzy: Pencarian judul kanonikal, Romaji, Kanji, Indonesia, filter genre & status tayang.
- [x] Halaman Detail Anime: Episode list selector, badge status tayang, sinopsis, merchandise terkait, tombol Bagikan.
- [x] Watch Page & Player Multi-Provider:
  - [x] Pemilihan resolusi dinamis (Auto, 360p, 480p, 720p, 1080p).
  - [x] Daftar multi-provider per resolusi (Server Alpha, Server Beta, Server Delta, Server Gamma, Server Epsilon, Muse YouTube).
  - [x] Player embed adapter on-demand (YouTube Adaptive vs Custom Embed).
  - [x] Quick fallback ke provider lain di kualitas yang sama jika terjadi error.
  - [x] Pelaporan masalah player (Broken Player Report Modal & Ticket).
  - [x] Episode Quick Pills switcher langsung di halaman pemutar.
  - [x] Tombol Bagikan / Salin Tautan video langsung.
- [x] Library & Continue Watching (Local storage tamu + Ekspor JSON).
- [x] Jadwal Rilis Mingguan: Kalender siaran 7 hari penuh (Senin–Minggu) dalam zona WIB.
- [x] Merchandise Discovery: Kurasi produk resmi mitra terverifikasi + filter judul anime (Shopee affiliate gated).

### PHASE 3 — Admin Operations (Zero-Code Control Plane) (Status: COMPLETED)
- [x] Admin Overview: Action Center & Health Snapshot (`/admin`).
- [x] Content Manager: CRUD Anime Metadata & 1-Klik Batch Episode Shell Generator (`/admin/content`).
- [x] Streaming Quality Matrix: Manajemen provider dinamis per resolusi per episode (`/admin/matrix`).
- [x] Provider Registry: Whitelist domain, tipe adapter, status aktif/paused/blocked (`/admin/providers`).
- [x] Rights & Takedown Console: Emergency pause & takedown audit log (`/admin/rights`).
- [x] Homepage Visual CMS: Reorder modul beranda, atur visibilitas, set Hero Spotlight tanpa deploy kode (`/admin/homepage`).
- [x] AdOps & Monetization: Manajemen inventaris kampanye iklan sponsor (`/admin/ads`).
- [x] Audit Trail: Buku besar audit aktivitas operasional terenkapsulasi (`/admin/audit`).

### PHASE 4 — Otomasi, Monitoring, & Keamanan (Status: COMPLETED)
- [x] Metadata Sync Ingest Wizard dengan deteksi duplikat otomatis & 1-klik import (`/admin/ingest`).
- [x] Health Monitoring & Broken Stream Auto-Triage dengan Auto-Quarantine threshold (>=3 laporan) (`/admin/monitoring`).
- [x] Merchandise Discovery Curation (Katalog produk terverifikasi & kepatuhan non-affiliate Shopee QA-040).
- [x] Perlindungan Keamanan: Embed URL domain allowlist verification & protocol validation (`validateEmbedUrl`).
- [x] Latency ping simulator & live stream status verification (`pingStreamVariant`).

### PHASE 5 — QA & Verifikasi Acceptance (Status: COMPLETED)
- [x] Verifikasi Skenario Acceptance Lengkap: 29 / 29 test cases lulus (100% PASS).
  - QA-001, QA-002: Search & multi-script alias lookup (Romaji, Kanji, Indonesia).
  - QA-010: Tri-state status separation (airing vs subtitle vs watchable).
  - QA-012, QA-013, QA-014: Multi-provider per resolution streaming invariant.
  - QA-015: Adaptive YouTube embed & no fabricated 1080p quality.
  - QA-033: Zero-code admin matrix stream addition.
  - QA-035: Emergency takedown & immediate public removal.
  - QA-040: Shopee non-affiliate gating compliance.
  - QA-050, QA-051: Homepage visual CMS dynamic layout & Hero Spotlight.
  - QA-055, QA-056: 1-click batch episode generator.
  - QA-060, QA-061: Provider registry & domain allowlist.
  - QA-065: Ingest duplicate prevention across canonical titles and aliases.
  - QA-066: Auto-quarantine trigger on 3 user reports & admin recovery.
  - QA-067: Embed URL domain allowlist validation.
- [x] Production Build Validation: 21 / 21 routes compiled clean with 0 TypeScript/lint errors.
- [x] SEO & Mobile PWA Integration: `manifest.webmanifest`, `robots.txt`, `sitemap.xml`.
- [x] Mobile UX Polish: Bottom navigation 44px touch targets, zero AI-slop layout, high-density dark UI.

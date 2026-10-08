# ANIME HOME — MASTER IMPLEMENTATION PLAN

## Rencana Fase Eksekusi & Status Milestones

### PHASE 0 — PRD Audit & Implementation Blueprint (Status: COMPLETED)
- [x] Ekstraksi menyeluruh 40 halaman PRD Master v0.1.
- [x] Penetapan Invarian: Multi-provider per resolusi, Tri-State Intelligence, Zero-code Admin, Shopee Gating.
- [x] Inisialisasi struktur dokumen proyek `/docs`.

### PHASE 1 — Fondasi & Arsitektur Inti (Status: IN PROGRESS)
- [x] Inisialisasi Next.js (App Router), TypeScript, Tailwind CSS.
- [x] Konfigurasi Design System (dark-first, tokens, responsive 360-390px base).
- [x] Pembuatan Schema Drizzle ORM (42 entitas relasional terverifikasi).
- [x] Pembuatan Seed Data realistis (Anime canonical, episode shells, multi-provider matrix, banner iklan, dsb.).
- [x] Implementasi Portable Provider Adapters (`VideoProviderAdapter`, `MetadataAdapter`, `AuthAdapter`).
- [x] Implementasi Role-Based Access Control (RBAC) & Server-side Permission Enforcement.

### PHASE 2 — Core Anime Consumer Experience
- [ ] Beranda Publik: Banner editorial, Continue Watching, Baru Tayang, Playable Sub Indo.
- [ ] Navigasi Mobile-First: Bottom Navigation (Home, Anime, Discover, Me) + Quick Search.
- [ ] Katalog & Search Fuzzy: Pencarian judul kanonikal, Romaji, Indonesia, filter genre/musim/status.
- [ ] Halaman Detail Anime: Episode list selector, badge status tayang, info franchise.
- [ ] Watch Page & Player Multi-Provider:
  - Pemilihan resolusi dinamis (Auto, 360p, 480p, 720p, 1080p).
  - Daftar multi-provider per resolusi (Server A, Server B, Server C).
  - Player embed adapter on-demand.
  - Quick fallback ke provider lain di kualitas yang sama jika terjadi error.
  - Pelaporan masalah player (Broken Player Report Ticket).
- [ ] Library & Continue Watching (Local storage tamu + Sinkronisasi akun).

### PHASE 3 — Admin Operations (Zero-Code Control Plane)
- [ ] Admin Overview: Action Center & Health Snapshot.
- [ ] Content Manager: CRUD Anime, Seasons, Episode Shells batch creation.
- [ ] Streaming Quality Matrix: Manajemen provider dinamis per resolusi per episode.
- [ ] Rights & Takedown Console: Emergency pause & takedown audit log.
- [ ] Homepage Visual CMS: Reorder modul beranda tanpa deploy.
- [ ] AdOps & Monetization: Manajemen inventaris iklan (Better Ads compliant) & status Shopee gating.
- [ ] Mobile Admin Emergency Bar: Disable source & pause ads dari perangkat HP.

### PHASE 4 — Otomasi, Monetisasi, & Keamanan
- [ ] Metadata Sync Ingest Wizard dengan deteksi duplikat & diff review.
- [ ] Health Monitoring & Broken Stream Auto-Triage.
- [ ] Merchandise Discovery Curation (Katalog produk terverifikasi & safe outbound links).
- [ ] Perlindungan Keamanan: SSRF protection, link allowlisting, XSS escaping, rate limits.

### PHASE 5 — QA & Verifikasi Acceptance
- [ ] Verifikasi 70 Skenario QA (QA-001 s.d. QA-070).
- [ ] Pengujian Mobile Responsive (320px, 360px, 390px, 430px, tablet, desktop).
- [ ] Pengujian Aksesibilitas WCAG 2.2 AA (kontras, touch target 44px, screen reader labels).

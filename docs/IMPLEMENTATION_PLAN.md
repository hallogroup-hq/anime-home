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

### PHASE 4 — Otomasi, Monetisasi, & Keamanan (Status: NEXT TARGET)
- [ ] Metadata Sync Ingest Wizard dengan deteksi duplikat & diff review.
- [ ] Health Monitoring & Broken Stream Auto-Triage.
- [ ] Merchandise Discovery Curation (Katalog produk terverifikasi & safe outbound links).
- [ ] Perlindungan Keamanan: SSRF protection, link allowlisting, XSS escaping, rate limits.

### PHASE 5 — QA & Verifikasi Acceptance (Status: IN PROGRESS)
- [x] Verifikasi Skenario QA Inti (19/19 test cases pass).
- [ ] Verifikasi Skenario Lengkap (QA-001 s.d. QA-070).
- [ ] Pengujian Mobile Responsive (320px, 360px, 390px, 430px, tablet, desktop).
- [ ] Pengujian Aksesibilitas WCAG 2.2 AA (kontras, touch target 44px, screen reader labels).

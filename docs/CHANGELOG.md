# CHANGELOG

## [0.5.0] - 2026-10-09
### Ditambahkan (Pillar 4 & Pillar 5 Core Fandom & Community Capabilities)
- **Panduan Urutan Nonton Waralaba (Franchise Watch Order Guide)**: Pemetaan urutan tontonan kronologis vs tanggal rilis, penandaan Canon/Movie/Filler, dan navigasi lintas seri (`WatchOrderGuide.tsx`, QA-071).
- **Direktori Karakter & Pengisi Suara (Seiyuu / Cast)**: Tampilan visual karakter utama & pendukung beserta nama seiyuu Jepang (`CharacterList.tsx`, QA-072).
- **Diskusi Episode Ramah Spoiler (Spoiler-Masked Comments)**: Feed komentar episode dengan proteksi sensor blur klik-untuk-buka dan voting reaksi like (`EpisodeDiscussion.tsx`, QA-073).
- **Mode Teater & Matikan Lampu (Theater Mode & Focus Dimmer)**: Kontrol perlebar layar dan redup latar belakang langsung pada pemutar video (`MultiProviderPlayer.tsx`).
- **Autentikasi Pengguna & Sinkronisasi Cloud**: Modal login/daftar akun dengan sinkronisasi otomatis riwayat tontonan dan koleksi lintas peramban (`AuthModal.tsx`, QA-074).
- **Filter Multi-Kriteria & Pengurutan Katalog**: Filter berdasarkan tahun, musim tayang, format (TV/Movie/OVA), genre, dan pengurutan judul A-Z / rilis terbaru (`/anime`, QA-075).
- **Tri-State Status Badging pada Episode**: Indikator ketersediaan Sub Indo terverifikasi, episode berjadwal, dan badge status tayang (`EpisodeList.tsx`).
- **Acceptance Test Suite Expansion**: Peningkatan cakupan menjadi 42 / 42 skenario pengujian lulus 100%.

## [0.4.0] - 2026-10-09
### Ditambahkan (Phase 4 & Phase 5: Automation, Monitoring, Security & PWA)
- **Metadata Ingestion Wizard (`/admin/ingest`)**: Penarikan kandidat anime musiman dari API eksternal (AniList / MAL) dengan validasi pencegahan duplikat (QA-065).
- **Health Monitoring & Auto-Quarantine Console (`/admin/monitoring`)**: Antrean karantina otomatis untuk stream yang mencapai threshold $\ge 3$ laporan kerusakan penonton (QA-066), pemulihan 1-klik, dan simulasi latency ping.
- **Embed URL Security Allowlist (`validateEmbedUrl`)**: Validasi domain pihak ketiga resmi dan penolakan skema non-HTTP/HTTPS (QA-067).
- **PWA & SEO Routes**: Web App Manifest (`/manifest.webmanifest`), Robots (`/robots.txt`), dan dynamic Sitemap (`/sitemap.xml`).
- **Comprehensive Acceptance Test Suite**: Peningkatan cakupan pengujian menjadi 29 / 29 skenario lulus 100%.

## [0.3.0] - 2026-10-09
### Ditambahkan (Phase 2 & Phase 3 Core Capabilities)
- **Homepage Visual CMS (`/admin/homepage`)**: Tata letak beranda berbasis modul tanpa deploy kode, pemilihan Hero Spotlight dinamis, dan kontrol visibilitas seksi.
- **Content Manager (`/admin/content`)**: Formulir tambah anime baru dan batch-creator episode shells 1-klik.
- **Provider Registry (`/admin/providers`)**: Pendaftaran domain whitelist, pemilihan adapter API pemutar, dan emergency pause provider.
- **Navbar Instant Search Dropdown**: Penelusuran langsung dengan dropdown pratinjau thumbnail saat mengetik di bilah pencarian.
- **Episode Quick-Switcher**: Tombol pil episode horizontal langsung di bawah pemutar video untuk navigasi cepat.
- **Tombol Salin Tautan (Share)**: Di halaman pemutar video dan halaman detail anime.
- **Acceptance Test Suite Expansion**: Menambahkan skenario QA-050, QA-051, QA-055, QA-056, QA-060, QA-061 (Total 19/19 lulus 100%).

## [0.2.0] - 2026-10-09
### Diperbaiki & Dirombak
- Eliminasi seluruh pola AI Slop (badge berlebih, teks alay, klaim provokatif).
- Pemilih resolusi dan server multi-provider dibuat menonjol, intuitif, dan responsif langsung di bawah viewport video.
- Perbaikan bug infinite loop pada client mount dan penambahan `pointer-events-none` pada layer gradien visual beranda.
- Kalender jadwal rilis mingguan 7 hari penuh (Senin s.d. Minggu) dalam zona WIB.
- Filter interaktif kategori merchandise dan gating kepatuhan affiliate Shopee.

## [0.1.0] - 2026-10-09
### Ditambahkan
- Audit komprehensif PRD Master v0.1 (40 halaman).
- Struktur dokumentasi 18 file di `/docs`.
- Skema relasional Drizzle ORM untuk katalog, episode, provider, dan matriks kualitas.
- Model multi-provider streaming dengan dukungan varian tak terbatas per resolusi.
- Rencana implementasi milestone (Fase 0 s.d. Fase 5).

# CHANGELOG

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

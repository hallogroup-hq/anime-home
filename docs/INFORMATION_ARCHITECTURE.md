# INFORMATION ARCHITECTURE & NAVIGATION MAP

## 1. Peta Situs Publik (Consumer Platform)
- `/`: Beranda
  - Pengguna Anonim: Hero spotlight, Quick search, Episode Hari Ini (WIB), Anime Populer, Koleksi Rekomendasi.
  - Pengguna Masuk: Continue Watching (paling atas), Episode Baru untuk Kamu, Rekomendasi Personal.
- `/anime`: Eksplorasi Katalog
  - Filter interaktif: Genre, Tipe (TV, Movie, OVA), Musim, Tahun, Status Penayangan, Ketersediaan Sub Indo.
  - Pencarian fuzzy dengan autosuggest.
- `/anime/[slug]`: Halaman Detail Anime
  - Metadata kanonikal, sinopsis, status rilis, daftar episode yang dapat dikelompokkan (1-25, 26-50), tombol tonton instan.
- `/watch/[episodeSlug]`: Halaman Pemutar Video
  - Pemutar video responsif 16:9.
  - Multi-provider selector (Pilihan resolusi -> Pilihan server provider).
  - Tombol aksi: Episode Sebelumnya / Selanjutnya, Laporkan Masalah, Simpan Progres.
  - Rekomendasi relevan dan kurasi merchandise terkait di bawah player.
- `/schedule`: Kalender Rilis Anime
  - Penjadwalan berdasarkan zona waktu Indonesia (WIB/WITA/WIT), pemisahan status Aired vs Delay.
- `/discover`: Hub Merchandise & Komunitas
  - Kurasi barang anime terverifikasi per judul/karakter.
- `/me`: Dashboard Pengguna
  - Watchlist (Ingin Ditonton, Sedang Ditonton, Selesai), Riwayat Tontonan, Pengaturan Akun & Privasi.

## 2. Peta Situs Admin Console (`/admin`)
- `/admin`: Overview & Action Center (Metrik kesehatan, antrean laporan mendesak).
- `/admin/content`: Manajemen Judul Anime, Musim, dan Episode.
- `/admin/streaming`: Matriks Kualitas & Manajemen Multi-Provider per Episode.
- `/admin/rights`: Buku Besar Izin Penayangan & Konsol Takedown Darurat.
- `/admin/schedule`: Pemantauan Jadwal Tayang & Antrean Subtitle.
- `/admin/homepage`: CMS Visual Beranda (Pengurutan seksi tanpa redeploy).
- `/admin/monetization`: Inventaris Iklan Sponsor & Kebijakan Shopee Affiliate Gating.
- `/admin/users`: Manajemen Pengguna, Sesi, dan Hak Akses RBAC.
- `/admin/system`: Job Monitoring, Audit Logs Tak Terhapuskan, Pengaturan Keamanan.

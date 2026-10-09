# ANIME HOME — Core Codebase Memory & Operational Invariants

Dokumen aturan ini otomatis dibaca oleh AI coding agent (Antigravity/Gemini) untuk memastikan konteks tidak hilang pada sesi-sesi mendatang.

---

## 1. Arsitektur Data & Alur Sinkronisasi
1. **Single Source of Truth**:
   - Runtime store berada di `src/lib/services/store.ts` (`AnimeHomeDataStore` singleton).
   - Database persisten adalah **PostgreSQL** (Neon cloud serverless / TCP pool via Drizzle ORM).
   - Seed baseline tersimpan di `src/lib/data/seed.ts` dan cache snapshot di `src/lib/data/live_data.json`.
2. **Aturan Sinkronisasi**:
   - Setiap perubahan data (tambah anime, ubah episode, ganti embed URL video, banner) dapat disinkronkan langsung via tombol **"Sinkronkan Database"** di Admin Console (`/admin`) atau server action `syncAllToDatabaseAction()`.
   - Script CLI sync: `npx tsx scripts/sync_to_postgres.ts`.
   - Tes invariant dan keamanan harus selalu dijalankan: `npm test` (wajib lulus 64/64 tes).

---

## 2. Invarian Pemutar Video (Player & Streams)
1. **Tidak Ada Pengalihan Keluar (No External Redirects)**:
   - Pengguna harus menonton langsung di platform Anime Home (`/watch/[episodeId]`).
   - Dilarang memasukkan tautan yang mengalihkan user ke platform luar seperti Disney+ Hotstar, Netflix, dll.
2. **Multi-Resolusi & Multi-Provider**:
   - Setiap episode yang tayang harus memiliki minimal **2 opsi resolusi** (contoh: 720p dan 1080p, atau 480p dan 720p).
   - Sumber stream yang didukung:
     - Google Stream / Blogger HD: `https://www.blogger.com/video.g?token=...`
     - Mega NZ Embed: `https://mega.nz/embed/...`
     - YouTube Embed (khusus kanal resmi Muse Indonesia, Ani-One Asia).
3. **Penyembunyian Watermark & File Name**:
   - Komponen player (`MultiProviderPlayer.tsx`) memiliki top mask branded (`ANIME HOME • [Judul] — Ep [No]`) untuk menutupi nama file fansub atau teks yang tidak diinginkan di header iframe.

---

## 3. Invarian Metadata & Tampilan Katalog
1. **Jadwal Tayang (Schedule) Riil**:
   - Hari rilis harus mencerminkan jadwal riil (Senin s/d Minggu), bukan disamakan semua di hari Minggu.
   - Status tayang dibagi menjadi:
     - `airing` (Sedang Tayang / Ongoing)
     - `completed` (Tamat)
2. **Teks Bersih & Bebas Slop**:
   - Label seksi di beranda cukup `"Episode Baru Tayang (Ongoing)"` tanpa embel-embel deskripsi berbelit-belit.
   - Jangan gunakan frasa berlebihan seperti "Pilihan Redaksi".
   - Halaman `/prototype` dan `/lab` dilarang ditampilkan ke pengguna publik.
3. **Banner Promo & Iklan**:
   - Banner beranda dikelola di `/admin/ads` dan slot `home_leaderboard`.
   - Gambar banner utama saat ini menggunakan gambar anime widescreen (1024x256).
   - Dilarang menambahkan badge "Sponsor Resmi" pada slot banner jika diminta bersih.
4. **Merchandise**:
   - Data merchandise diambil dari produk asli dengan foto asli (`INITIAL_MERCH_ITEMS`).
   - Gating affiliate Shopee: `isAffiliate: false` jika belum memiliki API partner resmi.

---

## 4. Cara Cepat Mengubah atau Menambah Link Video (Panduan Admin / AI)
- **Melalui Dashboard**: Buka `/admin/matrix` -> Pilih Anime -> Pilih Episode -> Klik "Edit Link" pada server terkait -> Masukkan URL Embed baru -> Simpan -> Klik "Sinkronkan DB".
- **Melalui Kode**: Ubah entri di `src/lib/data/seed.ts` (`INITIAL_STREAM_VARIANTS`) -> Jalankan `npx tsx scripts/sync_to_postgres.ts` -> Jalankan `npm test`.

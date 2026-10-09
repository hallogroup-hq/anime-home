# Codebase Memory: Anime Home Architecture & Operations

Dokumen ini adalah memori inti (*Codebase Memory*) untuk proyek **Anime Home**, mencakup arsitektur sistem, skema data, integrasi video player, dan tata cara pengelolaan konten agar setiap iterasi pengembangan berjalan lancar tanpa kebingungan.

---

## 1. Ringkasan Eksekutif & Tech Stack

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Framework** | Next.js 15 (App Router, Turbopack) | React 19, Server Actions, Dynamic Routes |
| **Styling** | Tailwind CSS v4, Lucide React | Dark theme `#090A0F`, Red accent `#DC2626` |
| **Database** | PostgreSQL (Neon Cloud / Drizzle ORM) | Tabel anime, episodes, stream_variants, merchandise |
| **Runtime Data Store** | In-Memory Singleton (`store.ts`) | Respons instan di edge / client dengan sinkronisasi ke PostgreSQL |
| **Streaming Engine** | Multi-Provider Embed Player | Blogger HD, Mega NZ, YouTube resmi |
| **Testing Suite** | TypeScript Acceptance (64 Tests) | `npm test` (QA invariants & security persistence) |

---

## 2. Peta Direktori Utama

```
src/
├── app/
│   ├── page.tsx                    # Beranda (Hero, Ongoing, Completed, Merch, Promo Banner)
│   ├── anime/                      # Katalog publik & filter tahun/genre/status
│   │   └── [slug]/page.tsx         # Detail anime, sinopsis, karakter, daftar episode
│   ├── watch/[episodeId]/page.tsx  # Halaman pemutar video, multi-resolusi, diskusi
│   ├── schedule/page.tsx           # Jadwal rilis riil mingguan (Senin - Minggu)
│   └── admin/                      # Admin Console
│       ├── page.tsx                # Ringkasan metrik & tiket laporan video
│       ├── matrix/page.tsx         # EDITOR VIDEO: Ubah link embed, tambah server, tes player
│       ├── content/page.tsx        # EDITOR KATALOG: Edit anime, tambah episode, batch generator
│       ├── ads/page.tsx            # EDITOR IKLAN: Ganti banner & URL promo
│       ├── providers/page.tsx      # Registry whitelist provider
│       └── monitoring/page.tsx     # Auto-quarantine & latency monitoring
├── components/
│   ├── player/
│   │   ├── MultiProviderPlayer.tsx # Pemutar video multi-resolusi dengan top mask branded
│   │   └── EpisodeDiscussion.tsx   # Feed komentar & spoiler masking
│   ├── ads/
│   │   └── SafeAdSlot.tsx          # Komponen slot banner iklan yang aman
│   └── layout/
│       ├── Navbar.tsx              # Navigasi utama
│       └── Footer.tsx              # Footer bersih tanpa console admin publik
├── lib/
│   ├── actions/                    # Next.js Server Actions (CRUD & sync)
│   ├── db/                         # Drizzle ORM schema & Postgres client
│   ├── services/
│   │   ├── store.ts                # In-memory singleton data store
│   │   └── seasonVerification.ts   # Mesin verifikasi kesiapan tayang
│   └── data/
│       └── seed.ts                 # Data awal seluruh anime, episode, dan stream
scripts/
└── sync_to_postgres.ts             # Script CLI sinkronisasi ke database
tests/                              # Acceptance & security test suites
docs/                               # Dokumentasi arsitektur & panduan operasional
```

---

## 3. Alur Data & Sinkronisasi (Data Synchronization Flow)

```
[ User di Admin UI ]
        │
        ▼ (Mengubah Link Video / Tambah Episode / Ubah Banner)
[ Next.js Server Action ]
        │
        ├── 1. Perbarui In-Memory Store (`store.ts`)  ──> UI langsung reaktif
        ├── 2. Tulis Perubahan ke PostgreSQL (Neon)    ──> Data persisten di cloud
        └── 3. Cache ke Disk (`live_data.json`)        ──> Tidak hilang saat server restart
```

Dengan alur ini:
- **Admin / Pengguna**: Cukup buka `/admin/matrix` atau `/admin/content`, edit di browser, klik tombol **"Sinkronkan DB"**, dan perubahan seketika aktif.
- **AI Agent / Pengembang**: Tidak perlu membongkar puluhan file TypeScript. Cukup manfaatkan server action atau update `seed.ts` dan jalankan `sync_to_postgres.ts`.

---

## 4. Invarian Bisnis yang Wajib Ditaati

1. **Anti-Redirect (Menonton Harus di Anime Home)**:
   - Dilarang menaruh link pengalihan ke Disney+, Netflix, Crunchyroll, atau situs luar.
   - Pengguna harus bisa memutar video langsung di web Anime Home.
2. **Minimal 2 Opsi Resolusi**:
   - Setiap episode wajib menyediakan minimal 2 opsi resolusi (contoh: 720p dan 1080p, atau 480p dan 720p).
3. **Penyembunyian Identitas Fansub/Nama File**:
   - `MultiProviderPlayer.tsx` menggunakan header overlay gelap untuk menutupi nama file atau judul internal fansub agar tampilan terlihat bersih dan profesional.
4. **Jadwal Tayang Riil**:
   - Hari tayang di `/schedule` dan Beranda harus sesuai jadwal rilis asli (Senin s/d Minggu), bukan disamakan semua di satu hari.
5. **Banner Iklan & Sponsor**:
   - Banner beranda dikontrol melalui `/admin/ads` (`home_leaderboard`).
   - Tidak menggunakan badge "Sponsor Resmi".

---

## 5. Perintah Standar Pengembangan

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan server development Next.js lokal |
| `npm test` | Menjalankan seluruh test invariant dan keamanan (64 test) |
| `npm run build` | Menjalankan kompilasi produksi Next.js dengan typecheck |
| `npx tsx scripts/sync_to_postgres.ts` | Sinkronisasi data awal ke tabel PostgreSQL |

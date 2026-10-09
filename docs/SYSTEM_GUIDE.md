# Panduan Lengkap Sistem & Manajemen Konten Anime Home (Understand Anything)

Dokumen ini adalah panduan komprehensif untuk memahami seluruh arsitektur, alur data, dan tata cara operasional **Anime Home** agar kamu (atau siapapun pengelola situs) bisa mengubah, menambah, atau memantau video dan katalog dengan mudah, instan, dan tanpa kerumitan.

---

## 1. Arsitektur Inti: Kenapa Sekarang "Ga Ribet Lagi"?

Sebelum pembaruan ini, data terbagi antara file TypeScript seed, in-memory store, dan PostgreSQL. Setiap kali ingin mengganti link video atau menambah episode, harus mengubah file kode secara manual, menjalankan script migrasi, dan mendeploy ulang.

Sekarang, sistem telah dirombak dengan arsitektur **Tri-Layer Persistence**:

```
┌─────────────────────────────────────────────────────────────┐
│                       ADMIN CONSOLE                         │
│   (Tampilan Visual: Matriks Video, Katalog, & Promo Ads)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
            [ 1-Klik / Input Langsung di Browser ]
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER ACTIONS                   │
│   (Validasi Whitelist Keamanan + Role-Based Access Control) │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      IN-MEMORY RUNTIME       │ │   POSTGRESQL NEON CLOUD    │
│  • Respon instan < 10ms      │ │  • Penyimpanan persisten   │
│  • Player langsung reaktif   │ │  • Tidak hilang saat reboot│
└──────────────┬───────────────┘ └────────────────────────────┘
               │
               ▼
┌──────────────────────────────┐
│       DISK CACHE SNAPSHOT    │
│  • Cadangan `live_data.json` │
│  • Auto-load saat deploy baru│
└──────────────────────────────┘
```

### Keunggulan Sistem Baru:
1. **Edit Langsung di Browser**: Kamu bisa mengubah URL video, mengganti resolusi, atau menghapus server yang rusak langsung dari halaman admin.
2. **Fitur "Tes Putar" (Inline Preview)**: Sebelum menyimpan, kamu bisa langsung mencoba memutar videonya di admin untuk memastikan videonya jalan dan ada subtitle-nya.
3. **1-Klik Sinkronisasi Database**: Ada tombol **"Sinkronkan DB"** di pojok kanan atas Admin Console. Sekali klik, seluruh perubahan langsung tersimpan ke PostgreSQL Neon Cloud.
4. **Zero Data Loss**: Snapshot otomatis dicadangkan sehingga restart server atau deployment Vercel tidak akan menghapus data yang baru kamu tambahkan.

---

## 2. Panduan Praktis: Cara Mengubah & Menambah Link Video

Semua pengelolaan video berada di menu: **[Matriks Server](/admin/matrix)**.

### A. Cara Mengganti / Memperbaiki Link Video yang Rusak
1. Buka **/admin/matrix**.
2. **Langkah 1**: Pilih anime di dropdown (misal: *Tokyo Revengers* atau *One Piece*).
3. **Langkah 2**: Klik nomor episode yang ingin diedit (misal: *Ep 02*).
4. **Langkah 3**: Pilih tab resolusi (*1080p*, *720p*, *480p*, atau *Auto*).
5. Pada kartu server yang ingin diubah, klik tombol kuning **"Edit Link"**.
6. Tempel (*paste*) URL embed video yang baru.
7. Klik **"Simpan Perubahan"**.
8. Klik tombol hijau **"Sinkronkan Database"** di bagian atas untuk menyimpan ke PostgreSQL. Selesai!

### B. Cara Mengetes Apakah Video Bisa Diputar
1. Pada kartu server di **/admin/matrix**, klik tombol **"Tes Putar"**.
2. Layar pemutar mini akan muncul di bawah kartu server.
3. Klik play untuk memastikan takarir (subtitle) Indonesia muncul dan video tidak buffer.
4. Klik **"Tutup Tes"** setelah selesai.

### C. Cara Menambah Server / Resolusi Baru
1. Buka **/admin/matrix**, pilih anime dan episode tujuan.
2. Klik tombol merah **"+ Tambah Server"** di pojok kanan atas.
3. Pilih Provider (misal: *Google Stream (Blogger HD)*, *Mega NZ*, dsb.).
4. Pilih Resolusi (*1080p*, *720p*, atau *480p*).
5. Masukkan URL Embed video.
6. Klik **"Simpan Server"**.

---

## 3. Panduan Praktis: Mengelola Episode & Katalog Anime

Semua pengelolaan judul dan episode berada di menu: **[Katalog & Episode](/admin/content)**.

### A. Menambah Episode Baru (Single Episode)
1. Buka **/admin/content** lalu klik tab **"Kelola Episode Anime"**.
2. Pilih judul anime.
3. Klik tombol **"+ Tambah 1 Episode"**.
4. Masukkan nomor episode (contoh: `03` atau `1181`) dan judul episode.
5. Klik **"Simpan Episode"**.
6. Setelah episode terbuat, langsung klik **"Buka Matriks Video"** untuk mengisi link streaming-nya!

### B. Membuat Banyak Episode Sekaligus (Batch Generator)
1. Buka **/admin/content** lalu klik tab **"Batch Episode Generator"**.
2. Pilih anime, masukkan jumlah episode (misal: `12`), dan episode awal (misal: `1`).
3. Klik **"Generate 12 Episode Shells"**.
4. Kerangka episode 01 s/d 12 langsung siap diisi link video.

### C. Mengubah Metadata Anime (Judul, Status Ongoing/Completed, Poster)
1. Buka **/admin/content** pada tab **"Daftar Katalog"**.
2. Pada kartu anime yang ingin diedit, klik tombol **"Edit"**.
3. Kamu bisa mengubah:
   - Judul resmi
   - Status tayang: `Ongoing` (Sedang Tayang) atau `Completed` (Tamat)
   - Tahun rilis & sinopsis
   - URL foto poster & banner
4. Klik **"Simpan Perubahan"**.

---

## 4. Panduan Praktis: Mengganti Banner Promo / Iklan Beranda

Semua pengelolaan banner berada di menu: **[Iklan & Sponsor](/admin/ads)**.

1. Buka **/admin/ads**.
2. Cari kampanye banner utama (`home_leaderboard`).
3. Klik tombol **"Ganti Gambar / Link"**.
4. Masukkan URL gambar banner baru (bisa path lokal seperti `/banners/anime-home-promo-banner.png` atau link gambar luar).
5. Pratinjau banner akan langsung muncul di form.
6. Masukkan tautan tujuan saat banner diklik.
7. Klik **"Simpan Banner"**. Banner di halaman depan seketika berubah!

---

## 5. Tips Mengambil Link Video (Samehadaku / Blogger / Mega)

Ketika mencari sumber streaming dari Samehadaku (`v2.samehadaku.how`):
1. Buka halaman episode anime di Samehadaku.
2. Klik kanan -> *Inspect Element* (atau tekan `F12`).
3. Cari elemen `<select id="server">` atau tombol server pemutar.
4. Salin nilai atribut `data-embed` atau `src` dari iframe:
   - **Google Stream / Blogger HD**:
     `https://www.blogger.com/video.g?token=AD6v...&origin=sameguru2.blogspot.com`
   - **Mega NZ**:
     `https://mega.nz/embed/...`
5. Tempelkan URL tersebut ke kolom **Embed URL** di Anime Home Admin.
6. Player Anime Home secara otomatis mengamankan tampilan dengan overlay branded sehingga watermark fansub atau nama file internal tidak mengganggu penonton.

---

## 6. Diagram Arsitektur Standalone (Archify)

Arsitektur visual interaktif Anime Home telah digenerate secara resmi menggunakan **Archify**:
- File interaktif HTML: [`docs/architecture.html`](file:///Users/akmalirsyadpermana/.gemini/antigravity/scratch/anime-home/docs/architecture.html)
- Spesifikasi JSON: [`docs/architecture.json`](file:///Users/akmalirsyadpermana/.gemini/antigravity/scratch/anime-home/docs/architecture.json)

Kamu dapat membuka `docs/architecture.html` di browser manapun untuk melihat trace dataflow interaktif, mode gelap/terang, filter alur admin, dan rincian komponen sistem.

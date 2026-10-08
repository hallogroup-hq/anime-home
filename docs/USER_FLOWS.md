# USER FLOWS & USER JOURNEYS (J01 - J10)

## J01 — Pengguna Anonim Menonton Episode Terbaru
1. Datang dari Pencarian / Beranda / Link Luar.
2. Membuka Halaman Detail Anime: Sistem menampilkan 3 status (Aired, Sub Indo, Watchable).
3. Memilih Episode terbaru.
4. Pada Halaman Watch:
   - Sistem memeriksa resolusi yang memiliki sumber aktif.
   - Menampilkan chip resolusi yang tersedia (misal: `720p`, `1080p`).
   - Pengguna memilih `720p`.
   - Muncul daftar provider: `Server A`, `Server B`, `Server C`.
   - Pengguna mengklik `Server B`.
   - Player embed termuat on-demand tanpa login gate.

## J02 — Memilih Beberapa Provider dalam 1080p & Penanganan Error
1. Pengguna memilih tab resolusi `1080p`.
2. Sistem me-render semua server aktif untuk 1080p: `Server A`, `Server D`.
3. Pengguna memilih `Server A`. Jika server gagal/error:
   - Muncul notifikasi error bersahabat.
   - Sistem menampilkan tombol utama: *"Coba Server Lain di Kualitas 1080p"* (`Server D`).
   - Tidak ada paksaan penurunan kualitas ke 720p kecuali pengguna yang memilihnya sendiri.

## J03 — Seasonal Viewer Menunggu Sub Indo
1. Pengguna menambahkan anime ke Watchlist / Follow.
2. Episode berstatus `Aired` di Jepang, namun `subtitle_state` masih `pending` / `not_available`.
3. UI dengan jujur menampilkan badge *"Aired (Sub Indo belum tersedia)"*.
4. Ketika admin/otomasi memverifikasi ketersediaan Sub Indo, status diperbarui ke `available`.

## J04 — Pelacakan Progres Lintas Perangkat & Tamu
1. Pengguna tamu menonton episode: progres disimpan di `localStorage`.
2. Pengguna mendaftar/login: progres lokal disinkronkan ke akun database.
3. Menandai episode selesai secara manual jika player eksternal tidak mengirimkan event progres otomatis.

## J08 — Pelaporan Masalah Player
1. Tombol "Laporkan Masalah" tersedia di bawah player.
2. Pengguna memilih alasan: *Tidak bisa diputar*, *Salah episode*, *Subtitle salah*, *Dibatasi wilayah*, dsb.
3. Laporan masuk ke antrean triage admin; jika ambang batas laporan tercapai, server ditandai untuk review tanpa menghapus data secara otomatis.

## J10 — Penarikan Hak Cipta Darurat (Takedown)
1. Laporan keluhan hak cipta diterima.
2. Admin mengaktifkan aksi darurat `Pause Source` / `Takedown`.
3. Seluruh halaman tonton yang merujuk pada sumber tersebut langsung menyembunyikan sumber tersebut seketika.

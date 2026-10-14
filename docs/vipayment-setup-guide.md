# Integrasi VIPayment — langkah tanpa menaruh secret di kode

**Project:** Anime Home → fitur Top Up & Digital Products (PR #3). Production belum aktif.

## A. Keamanan dulu (wajib)

Screenshot API VIPayment yang pernah dikirim memperlihatkan API Key. **Anggap key tersebut terekspos**; jangan dipakai untuk produksi atau dikirim ulang lewat chat.

1. Masuk ke dashboard VIPayment → **Profil → Pengaturan API**.
2. Tekan tombol regenerate di sebelah **API Key**. Catat API ID dan **API Key baru** hanya di Vercel. Nilai **Sign** dibuat otomatis dengan MD5(API ID + API Key); **jangan** tambahkan sebagai environment variable ketiga.
3. Jika API Key yang lama sudah dipakai aplikasi lain, migrasikan aplikasi tersebut ke key baru.
4. Jangan memasang key di GitHub, URL, screenshot, chat, halaman admin publik, JavaScript frontend, atau nama variabel `NEXT_PUBLIC_*`.

## B. Simpan API ID dan API Key di Vercel (tanpa menampilkannya di chat)

Buka **Vercel → anime-home → Settings → Environment Variables**.

Buat variabel dengan nama berikut, masing-masing **type Sensitive/Secret**, target **Preview**, dan **Git Branch** `feat/digital-topup-store-foundation-20261014`:

| Nama environment variable | Isi |
|---|---|
| `VIPAY_API_ID` | API ID dari halaman Pengaturan API |
| `VIPAY_API_KEY` | API Key **baru** setelah regenerate |

Pastikan variable targetnya hanya Preview untuk pengujian. Simpan lewat form Vercel, jangan bagikan nilai apa pun. Deploy ulang preview setelah menyimpan environment variable agar deployment menggunakan konfigurasi baru.

**Tidak perlu PHP SDK**: Anime Home memakai Next.js / TypeScript sehingga implementasi menggunakan POST form-urlencoded server-side langsung ke endpoint resmi.

## C. Aktifkan hanya koneksi tes

Pastikan `TOPUP_STORE_ENABLED` masih `false` (default), jadi checkout tidak menerima pesanan. Jangan mengisi `TRIPAY_MODE=production` dulu.

Tambahkan `TOPUP_ADMIN_SYNC_KEY` sebagai secret acak minimal 32 karakter yang berbeda dari API Key VIPayment. Dipakai khusus untuk mengunci endpoint administrasi.

Tes koneksi tanpa transaksi: POST `/api/topup/admin/connection` dengan header Authorization Bearer **TOPUP_ADMIN_SYNC_KEY** menggunakan REST client lokal. Response berisi `connected`, `supplier`, `tier`, `balanceResponseValid`; tidak pernah menampilkan key atau saldo.

Setelah itu cek katalog dengan POST `/api/topup/admin/sync` memakai header otorisasi yang sama. Endpoint ini membaca API VIPPayment Game Feature type=services dan menyimpan katalog sungguhan; **tidak mengirim pesanan**. Hanya lakukan di lingkungan uji dengan database terpisah.

## D. Cara kerja dan cakupan API

- `/api/profile`: cek otentikasi supplier; tidak ditampilkan ke pelanggan.
- `/api/game-feature` type=services: SKU, harga, status, deskripsi. Harga jual dihitung di server; jangan masukkan harga dari browser.
- type=get-nickname: pemeriksaan nickname untuk game yang memiliki kode resmi; tidak membuat order.
- type=order: pemesanan game setelah pembayaran pelanggan benar-benar terkonfirmasi.
- type=status: rekonsiliasi vendor berdasarkan ID transaksi.
- webhook VIPPayment: status supplier, signature `X-Client-Signature` dan data transaksi diperiksa di server.

Dokumentasi: https://vip-reseller.co.id/page/api/game-feature dan https://vip-reseller.co.id/api/nickname-game-code.txt .

**Penting**: `/api/prepaid` adalah endpoint yang berbeda untuk pulsa/paket data; jangan mengirim order prepaid melalui `/api/game-feature`. Kategori prepaid membutuhkan adapter, validasi tujuan dan status order terpisah, bukan sekadar mengganti label produk.

## E. Pengaturan VIPayment yang ditampilkan di screenshot

- **API Status: Development**: biarkan selama pemeriksaan awal; perubahan Live hanya setelah kebijakan supplier dan tes dikonfirmasi.
- **Whitelist IP**: bukan tempat untuk URL Vercel. Vercel umumnya tidak menjamin satu IP outbound tetap dalam deployment standar. Jika VIPayment mewajibkan allowlist, perlu egress statis/proxy yang sesuai sebelum transaksi nyata. Jangan menambahkan IP callback supplier sebagai IP outbound Vercel.
- **Callback URL**: nanti isi URL publik yang valid (contoh struktur `https://domain-kamu/api/topup/callback/vip`), bukan URL testing yang sudah tidak digunakan. Pastikan VIPPayment berhasil mengirim callback bertanda tangan.
- **PHP SDK** hanya contoh pilihan klien. Gunakan adapter server-side TypeScript yang sudah disiapkan.

## F. Payment dan go-live

Untuk pelanggan, **TriPay dipisahkan dari GoPay merchandise**, menggunakan `TRIPAY_API_KEY`, `TRIPAY_PRIVATE_KEY`, `TRIPAY_MERCHANT_CODE` di Vercel (secret); buat akun/merchant TriPay dan validasi sandbox dulu.

Jangan hidupkan `TOPUP_STORE_ENABLED=true` hingga database preview terpisah, harga & produk terverifikasi, callback TriPay diuji, dan SOP refund/failed vendor ditentukan. Saat sandbox TriPay, **tidak ada pemesanan VIPPayment yang boleh terjadi**.

**Release gate**: verified VIPPayment credential after rotation; preview database isolation; supplier profile success; catalog sync sanity; payment sandbox successful but no vendor order; production payment and idempotency tests; final QA and explicit go-live approval.

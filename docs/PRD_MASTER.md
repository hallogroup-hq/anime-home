# ANIME HOME — MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Versi:** 0.1 — Baseline Living Document  
**Tanggal:** 9 Oktober 2026  
**Status:** DRAFT FOR VALIDATION / ARCHITECTURAL CONTRACT  
**Target Pasar:** Penggemar Anime di Indonesia (Mobile-First Web)  
**Infrastruktur Awal:** Next.js (App Router), Neon PostgreSQL + Drizzle ORM, Vercel  

---

## 1. Ringkasan Eksekutif & Value Proposition
ANIME HOME adalah platform mobile-first untuk penemuan streaming anime (*discovery*), pelacakan progres tontonan (*personal tracking*), panduan fandom, serta etalase *merchandise* resmi.

Platform ini memadukan 6 pilar inti:
1. **Anime Discovery & Multi-Provider Watch Access:** Akses pemutar dari sumber legal/terverifikasi, mendukung banyak provider di setiap tingkatan resolusi.
2. **Tri-State Anime Intelligence:** Tiga status independen:
   - Jadwal penayangan di Jepang (*airing state*).
   - Ketersediaan subtitle Indonesia (*subtitle state*).
   - Ketersediaan pemutaran terverifikasi (*watchability state*).
3. **Personal Continuity:** Watchlist, Continue Watching lintas perangkat, fallback manual saat event player eksternal terbatas.
4. **Franchise Navigation (P1):** Urutan tontonan (*release*, kronologis, rekomendasi) dan penanda canon/filler/OVA.
5. **Fandom Commerce & Community:** Kurasi merchandise resmi terverifikasi, direktori kreator/toko lokal, kalender acara anime, dan diskusi episode ramah spoiler.
6. **Self-Operated Admin Console:** Dashboard operasional tanpa kode (*zero-code*) untuk mengelola konten, streaming source matrix, rights takedown, CMS beranda, AdOps, audit, dan incident triage.

---

## 2. Invarian Teknis Non-Negosiabel
1. **Multi-Provider per Resolusi:** Setiap episode memiliki banyak resolusi, dan setiap resolusi dapat memiliki 0, 1, atau N provider (`count(provider for episode=E, quality=Q) ∈ {0..N}`).
2. **Tanpa Fabrikasi Kualitas:** Sumber adaptif (seperti YouTube IFrame) wajib diberi label `Auto`. Dilarang mengklaim 720p/1080p palsu.
3. **Penyimpanan Video Sendiri Dilarang:** Platform tidak menyimpan file video anime (*zero local video storage*) dan tidak melakukan proxy video bytes.
4. **Fallback Playback Sejenis:** Ketika server gagal, sistem harus memprioritaskan peralihan ke server lain pada resolusi yang sama sebelum menawarkan resolusi lain.
5. **Shopee Affiliate Gating:** Default `disabled`. Dilarang menggunakan tautan komisi afiliasi tanpa persetujuan tertulis resmi untuk penempatan media streaming.
6. **Better Ads Standards:** Tanpa pop-up menipu, tombol play palsu, sticky ads menutupi kontrol video, atau pre-roll buatan situs.
7. **Akses Tamu Tanpa Halangan:** Pengguna dapat mencari, membuka detail, dan memutar episode tanpa diwajibkan mendaftar akun terlebih dahulu.

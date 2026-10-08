# INTEGRATIONS & THIRD-PARTY POLICIES

## 1. Provider Streaming
- **YouTube Embed API:** Digunakan untuk channel resmi anime (misal: Muse Indonesia, Ani-One Asia). Sifat: adaptive quality (`Auto`), dilarang memaksa kontrol resolusi eksternal jika API melarang.
- **Official Player Iframes:** Iframe yang memiliki izin penayangan resmi. Harus aman dari clickjacking, CORS, atau redirect berbahaya.
- **Direct Stream Adapters (HLS/DASH):** Khusus jika sumber resmi menyediakan manifest HLS berlisensi.

## 2. Platform E-Commerce & Merchandise
- **Shopee Affiliate Program:** 
  - Status MVP: **Gated / Disabled**.
  - Ketentuan Shopee melarang link afiliasi pada platform streaming tanpa izin khusus.
  - Alternatif MVP: Kurasi link toko langsung non-komisi atau sponsorship mitra resmi.

## 3. Database & Hosting
- **Neon PostgreSQL:** Database relasional berbasis serverless PostgreSQL dengan branching & autoscaling.
- **Vercel:** Hosting Next.js App Router (Patuhi lisensi komersial sebelum memonetisasi iklan).

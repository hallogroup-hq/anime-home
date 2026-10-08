# ARCHITECTURAL & PRODUCT DECISIONS (ADR LOG)

- **ADR-001: Model Relasi Multi-Provider per Resolusi**
  - *Keputusan:* Menggunakan tabel `stream_variants` dengan kunci unik `(episode_id, provider_id, quality_label, source_ref)`.
  - *Alasan:* Memenuhi persyaratan wajib PRD bahwa satu episode dapat memiliki banyak resolusi, dan setiap resolusi dapat memiliki banyak provider independen (`count >= 0`).

- **ADR-002: Tri-State Intelligence Engine**
  - *Keputusan:* Memisahkan `airing_state`, `subtitle_state`, dan `watchability_state` menjadi 3 kolom/proses evaluasi mandiri.
  - *Alasan:* Mengantisipasi kenyataan bahwa episode yang sudah tayang di Jepang belum tentu memiliki takarir bahasa Indonesia atau tautan putar legal yang valid.

- **ADR-003: Gating Shopee Affiliate**
  - *Keputusan:* Modul afiliasi Shopee diatur nonaktif (*disabled*) secara default di tingkat basis data.
  - *Alasan:* Kepatuhan hukum dan ToS Shopee yang melarang peletakan tautan afiliasi individu pada platform pemutaran media tanpa izin tertulis resmi.

- **ADR-004: Mobile-First Geometry (360-390px Base)**
  - *Keputusan:* Mengutamakan layout bottom-nav dan tap target 44px untuk ponsel pintar, tanpa mengabaikan scaling ke desktop.
  - *Alasan:* Penggemar anime di Indonesia mayoritas mengakses konten melalui perangkat seluler (*mobile-first audience*).

# RELEASE CHECKLIST & GATES

Sebelum merilis versi produksi publik:

- [ ] **Content Rights Ledger:** Setiap stream variant memiliki pencatatan basis izin penayangan (`stream_rights`).
- [ ] **Hosting Compliance:** Vercel plan diizinkan untuk komersial sebelum mengaktifkan penempatan sponsor.
- [ ] **Better Ads Standards Verified:** Tidak ada iklan yang menutupi kontrol video, tidak ada pre-roll palsu.
- [ ] **Shopee Affiliate Gated:** Status tetap `disabled` kecuali ada dokumen izin tertulis khusus media streaming.
- [ ] **Multi-Provider Verified:** Setiap episode minimal memiliki 1 sumber aktif, dan mendukung multi-server di resolusi yang sama.
- [ ] **Admin Independence Verified:** 18 SOP operasional dapat diselesaikan tanpa memanggil developer atau menulis kueri SQL.
- [ ] **Mobile Performance:** LCP <= 2.5s, CLS <= 0.1 pada jaringan 4G mobile.
- [ ] **WCAG 2.2 AA Audited:** Semua tombol dan form memiliki rasio kontras memadai dan label aksesibilitas.

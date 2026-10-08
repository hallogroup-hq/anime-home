# ADMIN MODULES INVENTORY (PRD CHAPTER 10)

Dashboard Admin terdiri atas 29 kapabilitas terdistribusi dalam 10 submenu utama:

1. **ADM-OVERVIEW (Action Center & Health Snapshot):**
   - Menampilkan insiden prioritas tinggi (hak cipta, provider offline, laporan rusak).
   - Metrik pengguna aktif dan penayangan.
2. **ADM-ANIME (Anime Catalog Editor):**
   - Tab General, Klasifikasi, Artwork, SEO, dan Riwayat.
   - Deteksi kandidat judul duplikat secara otomatis.
3. **ADM-SEASONS & EPISODES:**
   - Batch-creator episode shell (contoh: Episode 1–12 sekali klik).
   - Pengaturan jam tayang berbasis zona waktu sumber dan konversi ke WIB.
4. **ADM-QUALITY-MATRIX (Multi-Provider by Resolution Matrix):**
   - Matrix per episode: Baris = Kualitas (`Auto`, `360p`, `480p`, `720p`, `1080p`), Kolom = Provider.
   - Tambah varian sumber baru tanpa membatasi jumlah provider per kualitas.
5. **ADM-PROVIDERS (Provider Registry):**
   - Registrasi domain, izin whitelist, adapter key, status aktif/paused/blocked.
6. **ADM-HEALTH (Monitoring Video):**
   - Triage laporan broken embed dari pengguna.
7. **ADM-RIGHTS (Hak Cipta & Takedown Console):**
   - Konsol keluhan hak cipta & emergency pause/takedown.
8. **ADM-HOMEPAGE (Visual CMS):**
   - Mengatur urutan seksi beranda, highlight anime, banner tanpa redeploy.
9. **ADM-ADS (AdOps & Sponsorship):**
   - Pengaturan penempatan iklan sponsor, capping frekuensi, reporting impression/click.
10. **ADM-AFFILIATE (Merchant & Affiliate Gating):**
    - Verifikasi bukti izin sebelum status affiliate Shopee diizinkan aktif.
11. **ADM-AUDIT (Audit Trail Tak Terhapuskan):**
    - Mencatat setiap perubahan (actor, timestamp UTC, perubahan nilai).
12. **ADM-RBAC (Role-Based Access Control):**
    - 9 Peran terisolasi dengan hak akses berbasis kapabilitas (*capabilities-based*).

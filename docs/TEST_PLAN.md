# TEST PLAN & QA STRATEGY

## Cakupan Pengujian
1. **Unit Testing:**
   - Validasi logika tri-state intelligence (`airing`, `sub Indo`, `watchable`).
   - Normalisasi teks dan pencarian alias Romaji/Inggris/Indonesia.
   - Perhitungan matriks provider per resolusi.
2. **Integration Testing:**
   - Drizzle ORM query & constraint verification (mencegah duplikasi varian yang identik).
   - Server-side RBAC authorization guards.
   - Provider adapter failover & error mapping.
3. **End-to-End (E2E) & User Journey Testing:**
   - **J01/J02:** Alur menonton dari pencarian -> memilih episode -> memilih 720p -> memilih provider A/B/C.
   - **J04:** Simpan progres continue watching (localStorage & user account).
   - **J08:** Pelaporan stream rusak menghasilkan tiket laporan yang dapat ditinjau di admin.
   - **J10:** Aksi takedown darurat di admin langsung menghilangkan sumber dari halaman tonton publik.
4. **Mobile & Accessibility Auditing:**
   - Pengujian viewport: 320px, 360px, 390px, 430px, 768px, 1024px.
   - Verifikasi kontras WCAG 2.2 AA dan ukuran target sentuh minimal 44x44px.

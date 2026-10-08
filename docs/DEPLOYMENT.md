# DEPLOYMENT & INFRASTRUCTURE GUIDE

## 1. Lingkungan Staging & Production
- **Platform:** Vercel (Next.js App Router).
- **Database:** Neon PostgreSQL Serverless (koneksi pooled via `@neondatabase/serverless` atau driver Postgres standar).
- **Variabel Lingkungan Wajib:**
  ```env
  DATABASE_URL=postgresql://user:password@ep-sample.region.neon.tech/animehome?sslmode=require
  NEXT_PUBLIC_APP_URL=https://animehome.id
  ADMIN_MFA_SECRET=your_jwt_or_auth_secret
  ENABLE_COMMERCIAL_ADS=false # diaktifkan setelah verifikasi akun komersial
  SHOPEE_AFFILIATE_STATUS=disabled # wajib disabled sebelum izin resmi tertulis
  ```

## 2. Prosedur Deployment
1. Jalankan `npm run build` untuk memverifikasi type-safety dan optimasi bundle.
2. Jalankan `npm run db:migrate` untuk menerapkan perubahan skema Drizzle.
3. Deploy branch ke staging untuk verifikasi smoke test.
4. Promote ke production setelah validasi release checklist.

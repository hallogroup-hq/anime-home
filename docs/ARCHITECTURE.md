# ARSITEKTUR SISTEM ANIME HOME

## 1. Prinsip Desain Arsitektur
1. **Separation of Concerns:** Pemisahan tegas antara UI layer, Domain Services, Provider Adapters, dan Data Persistence.
2. **Vendor Portability:** Tidak mengunci logika bisnis ke provider hosting/database tertentu. Integrasi luar berada di balik Adapter interface.
3. **No Direct Video Ingestion:** Sistem hanya mengelola metadata dan referensi embed resmi. Tidak ada transmisi bit video melalui server aplikasi.
4. **Resilient Streaming Hierarchy:** 
   - Episode -> Resolusi -> Daftar Provider Aktif.
   - Failover lokal di level resolusi yang sama.

## 2. Struktur Modul & Lapisan Kode
```
src/
├── app/                  # Next.js App Router (Public & Admin Routes)
│   ├── (public)/         # Rute Pengguna Publik (Home, Anime, Watch, Discover, Me)
│   ├── admin/            # Rute Admin Console (MFA/RBAC Protected)
│   └── api/              # Route Handlers & Webhook Endpoints
├── components/           # UI Components (Atomic, Accessible, Tailwind)
│   ├── common/           # Button, Card, Modal, Input, Badge, Toast
│   ├── layout/           # BottomNav, DesktopNav, Header, Footer
│   ├── player/           # MultiProviderPlayer, QualitySelector, ServerGrid
│   ├── admin/            # MatrixEditor, ActionQueue, TakedownModal
│   └── ads/              # SafeAdSlot (Better Ads Compliant)
├── lib/
│   ├── db/               # Drizzle Schema, Migrations, Client, Seeders
│   ├── adapters/         # VideoProvider, Metadata, Auth, AdOps
│   ├── services/         # Business Logic (Catalog, Stream, TriState, Admin)
│   ├── auth/             # Session & RBAC Enforcement
│   └── utils/            # Timezone (WIB/UTC), Formatters, Validation (Zod)
└── docs/                 # Dokumentasi Proyek Lengkap (18 Dokumen)
```

## 3. Provider Adapter Contracts
Setiap integrasi pemutar video mengimplementasikan interface `VideoProviderAdapter`:
```typescript
export interface VideoProviderAdapter {
  id: string;
  name: string;
  getCapabilities(): ProviderCapabilities;
  buildEmbedUrl(sourceRef: string, options?: EmbedOptions): string;
  canControlQuality(): boolean;
  canTrackProgress(): boolean;
  mapError(errorCode: string | number): FriendlyError;
}
```
Untuk provider adaptif (misal YouTube Embed), `canControlQuality()` mengembalikan `false`, dan label kualitas wajib bernilai `Auto`.

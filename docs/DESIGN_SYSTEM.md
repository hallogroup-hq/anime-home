# DESIGN SYSTEM & MOBILE UX GUIDELINES

## 1. Filosofi Visual
- **Dark-First:** Latar belakang utama charcoal/ink 950 (`#090A0F`), surface cards 900 (`#12151F`), borders 800/700 (`#1E2333`).
- **Restrained Anime Accent:** Aksen utama adalah Crimson Ruby / Vibrant Coral (`#FF3B5C` / `#FF4757`) yang tajam namun profesional, dipadukan dengan aksen fungsional (Emerald `#10B981` untuk Available/Sub Indo, Amber `#F59E0B` untuk Unverified/Delayed).
- **No AI Slop / No Overdecoration:** Tanpa glowing neon berlebih di semua kartu, tanpa glassmorphism berulang yang mengaburkan teks, tanpa animasi yang memperlambat rendering. Artwork poster anime menjadi fokus visual utama.

## 2. Standar Geometri Mobile
- **Basis Desain:** 360–390 CSS px (layar smartphone standar di Indonesia).
- **Target Sentuh (Touch Targets):** 
  - Minimum standar: 44x44 CSS px untuk tombol utama dan kontrol player.
  - Standar WCAG 2.2 AA: minimal 24x24 px dengan jarak aman.
- **Rasio Poster:** Rasio tetap 2:3 dengan skeleton placeholder untuk menghindari layout shift (CLS <= 0.1).
- **Grid Poster:**
  - Mobile: 2 kolom.
  - Tablet: 3-4 kolom.
  - Desktop: 5-6 kolom.

## 3. Komponen Utama
1. **Bottom Navigation (Mobile):** 4 destinasi utama: Beranda, Anime, Discover, Saya (Me).
2. **Episode Matrix Card:** Menampilkan nomor episode, status penayangan, ketersediaan Sub Indo, dan tombol Play.
3. **Multi-Provider Switcher:**
   - Baris 1: Chip Resolusi (`Auto`, `360p`, `480p`, `720p`, `1080p`).
   - Baris 2: Tombol/Grid Server Provider (`Server Alpha`, `Server Beta`, `Official Iframe`).
4. **Safe Ad Slot:** Wadah iklan dengan ukuran terisolasi (`reserved height`) agar tidak menggeser konten saat dimuat.

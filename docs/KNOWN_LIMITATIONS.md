# KNOWN LIMITATIONS & DEFENSIVE ASSUMPTIONS

1. **Kontrol Player Pihak Ketiga:**
   - Iframe pemutar pihak ketiga (termasuk YouTube API) mengelola bitrate dan resolusi secara adaptif.
   - Sistem **tidak dapat** memaksakan resolusi spesifik (misal memaksakan 1080p pada YouTube). Sumber adaptif dilabeli `Auto`.
2. **Keterbatasan Event Telemetri:**
   - Tidak semua iframe mengirimkan event `onTimeUpdate` atau `onEnded`.
   - Progres tontonan (*continue watching*) mengandalkan penandaan manual pengguna sebagai fallback utama yang andal.
3. **Penyimpanan Video:**
   - ANIME HOME tidak menyimpan atau melayani bit video. Ketersediaan pemutaran bergantung pada keabsahan domain penyedia pihak ketiga.
4. **Ketersediaan Takarir (Sub Indo):**
   - Penayangan siaran televisi di Jepang mendahului pembuatan takarir. Sistem secara tegas membedakan status rilis Jepang dan ketersediaan Sub Indo terverifikasi.

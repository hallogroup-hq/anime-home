# Project Guidelines & Invariants

## 1. Komunikasi & Respon
- **Sangat Ringkas & To The Point**: Dilarang memberikan detail atau penjelasan berlebih, rekapitulasi panjang, atau teks yang tidak diminta.

## 2. Larangan Desain & UI (Anti AI-Slop)
- **Dilarang Keras Menambahkan Badge/Shape AI-Slop Berwarna Merah atau Hijau**:
  - Dilarang membuat badge pill, tag, atau container bernuansa merah atau hijau artifisial.
  - Hindari ornamen visual buatan AI yang tidak esensial.
  - Desain harus clean, fungsional, minimalis, dan netral.

## 3. Pipeline Data & Deployment Invariant
- **Sinkronisasi Murni Lewat Database (Turso Cloud)**:
  - Dilarang melakukan git push ke branch `main` atau memicu build Vercel Production setiap kali menjalankan pipeline sinkronisasi.
  - Vercel Production membaca update data live secara dinamis langsung dari Turso Cloud Database (`db.syncWithTurso()`).

## 4. Urutan Anime Ongoing di Homepage
- **Hanya Anime dengan Update Episode Baru yang Maju ke Depan**:
  - Urutan anime ongoing WAJIB murni berdasarkan waktu update episode terbaru (`airedAt` / ordinal episode rilis terbaru).
  - Dilarang keras memajukan anime ke page depan berdasarkan jadwal hari (`scheduleWIB`) jika anime tersebut belum memiliki episode baru yang rilis.

<div align="center">
  <h1>📖 BacaYuk</h1>
  <p><strong>Aplikasi Buku Cerita Anak Interaktif & Edukatif</strong></p>
</div>

## Fitur Utama

BacaYuk adalah aplikasi membaca buku cerita anak interaktif dengan fitur-fitur canggih untuk mendukung pengalaman belajar dan bonding keluarga:

- **Buku Interaktif 3D (Flipbook)**: Pengalaman membaca seperti buku fisik sungguhan.
- **Baca Otomatis (Text-to-Speech)**: Buku bisa dibacakan secara otomatis.
- **Dua Bahasa (Bilingual)**: Tersedia mode Bahasa Indonesia (ID), Bahasa Inggris (EN), dan mode Dual untuk belajar bahasa.
- **Rekam Suara Orang Tua**: Ayah/Bunda bisa merekam suara mereka sendiri untuk setiap halaman, sehingga anak tetap bisa mendengar suara orang tuanya meski sedang tidak bersama.
- **Kosakata & Kuis Edukatif**: Integrasi fitur tap-to-translate (Glossary) dan kuis interaktif di akhir buku.
- **Personalisasi Bacaan**: Mode Siang/Malam, pengaturan ukuran teks, musik latar, dan mode 1 atau 2 halaman.
- **Akses Offline**: Tersedia opsi untuk mengunduh buku dalam format PDF atau EPUB.

## Teknologi yang Digunakan

- **Frontend**: React, Vite, Tailwind CSS, TypeScript
- **Backend & Database**: Node.js, Express, Supabase (Autentikasi & Database)
- **AI Integrations**: Google Gemini API (untuk generasi cerita, evaluasi kuis)
- **Payment Gateway**: Midtrans
- **Styling & Animasi**: Framer Motion, Lucide React

## Cara Menjalankan Secara Lokal

**Prasyarat:** Node.js terinstal di sistem Anda.

1. Install dependensi:
   ```bash
   npm install
   ```

2. Konfigurasi Environment Variables:
   Buat file `.env.local` di root folder dan isi dengan key berikut:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   MIDTRANS_SERVER_KEY=your_midtrans_server_key
   ```

3. Jalankan server pengembangan (menjalankan backend dan frontend):
   ```bash
   npm run dev
   ```

Aplikasi akan berjalan secara default di `http://localhost:3000`.

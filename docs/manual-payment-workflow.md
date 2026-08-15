# Workflow pembayaran manual BacaYuk

Order pembayaran dibuat dan disimpan di server untuk akun orang tua yang sedang login. Menutup modal, berpindah halaman, atau keluar dari sesi tidak menghapus order tersebut.

## Melanjutkan pembayaran

Setelah login kembali, user dapat membuka **Pengaturan Orang Tua → Pembayaran Saya**. Daftar ini hanya mengambil order milik user terautentikasi dan menyediakan aksi berikut:

- `pending_payment`: lanjutkan instruksi pembayaran dan unggah bukti;
- `pending_review`: periksa status verifikasi Admin;
- `rejected`: lihat alasan penolakan dan kirim ulang bukti;
- status final seperti `paid`, `expired`, `failed`, atau `cancelled` hanya ditampilkan sebagai riwayat.

Endpoint `GET /api/manual-payment-orders` tidak menerima ID user dari browser. Identitas user selalu diambil dari bearer token Supabase, lalu query dibatasi dengan `user_id` tersebut.

## Aturan kedaluwarsa

Order `pending_payment` dan `rejected` dapat kedaluwarsa sesuai `expires_at`. Setelah bukti berhasil dikirim dan status menjadi `pending_review`, tenggat pembayaran tidak lagi membatalkan order karena dana sudah diklaim telah dikirim dan perlu keputusan Admin.

Admin hanya dapat menyetujui atau menolak order `pending_review`. Persetujuan tetap menerbitkan entitlement melalui fungsi server yang sudah ada.

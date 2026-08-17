# Workflow pembayaran manual BacaYuk

Order pembayaran dibuat dan disimpan di server untuk akun orang tua yang sedang login. Menutup modal, berpindah halaman, atau keluar dari sesi tidak menghapus order tersebut.

## Melanjutkan pembayaran

Setelah login kembali, user dapat membuka **Pengaturan Orang Tua → Pembayaran Saya**. Daftar ini hanya mengambil order milik user terautentikasi dan menyediakan aksi berikut:

- `pending_payment`: lanjutkan instruksi pembayaran dan unggah bukti;
- `pending_review`: periksa status verifikasi Admin;
- `rejected`: lihat alasan penolakan dan kirim ulang bukti;
- status final seperti `paid`, `expired`, `failed`, atau `cancelled` hanya ditampilkan sebagai riwayat.

Endpoint `GET /api/manual-payment-orders` tidak menerima ID user dari browser. Identitas user selalu diambil dari bearer token Supabase, lalu query dibatasi dengan `user_id` tersebut.

## Kontak WhatsApp pembeli

Login Google dan Facebook tidak selalu memberikan nomor telepon. Karena itu, kontak WhatsApp pada checkout bersifat opsional. User dapat memilih nomor yang sudah tersimpan, menambahkan nomor baru dengan persetujuan notifikasi transaksi yang eksplisit, atau melanjutkan tanpa notifikasi WhatsApp.

- Satu akun dapat menyimpan beberapa nomor dan menetapkan satu nomor utama.
- Nomor dapat ditambah, diubah, dijadikan utama, atau dihapus melalui **Pengaturan Orang Tua → Nomor WhatsApp**.
- Endpoint kontak mengambil identitas user dari bearer token; browser tidak dapat menentukan `user_id` milik akun lain.
- Setiap order menyimpan ID kontak dan salinan nomor yang dipilih saat checkout. Perubahan nomor berikutnya tidak diam-diam mengalihkan tujuan order lama.
- Penghapusan akun membersihkan nomor dari catatan transaksi yang dipertahankan, sedangkan penghapusan satu kontak tidak menghapus riwayat order.

Jika user memilih memakai kontak WhatsApp, kontak tersebut wajib diverifikasi dengan kode sekali pakai melalui template Authentication WhatsApp sebelum dapat dipakai untuk pesanan. Pesanan tanpa kontak tetap dapat dibuat. Template Utility pelanggan dan template Admin tetap merupakan alur terpisah.

## Aturan kedaluwarsa

Order `pending_payment` dan `rejected` dapat kedaluwarsa sesuai `expires_at`. Setelah bukti berhasil dikirim dan status menjadi `pending_review`, tenggat pembayaran tidak lagi membatalkan order karena dana sudah diklaim telah dikirim dan perlu keputusan Admin.

Admin hanya dapat menyetujui atau menolak order `pending_review`. Persetujuan tetap menerbitkan entitlement melalui fungsi server yang sudah ada.

## Tampilan QRIS

Gambar QRIS pada instruksi pembayaran dapat ditekan untuk membuka preview layar penuh dengan kontras tinggi. Preview menyediakan tombol tutup, penutupan melalui backdrop, dan tombol Escape. Saat preview ditutup, fokus keyboard kembali ke tombol gambar QRIS.

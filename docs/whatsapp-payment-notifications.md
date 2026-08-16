# Notifikasi pembayaran WhatsApp BacaYuk

Dokumen ini menjelaskan notifikasi internal kepada Admin setelah pembeli mengunggah bukti pembayaran. Kegagalan WhatsApp tidak membatalkan unggahan bukti. Status dan tombol kirim ulang tersedia di Admin BacaYuk pada halaman Keuangan.

## Template WhatsApp Admin

Buat template kategori `UTILITY` dengan konfigurasi berikut:

- Nama: `pesanan_baru_bacayuk`
- Bahasa: Indonesian (`id`)
- Body: empat parameter posisi
- Tombol: `Visit website` dengan label `Open Dashboard Admin`
- URL tombol: `https://bacayuk.web.id/admin/finance` sebagai URL statis

Isi body harus menggunakan empat parameter dalam urutan berikut:

```text
Pesanan baru BacaYuk

Kode pesanan: {{1}}
Produk: {{2}}
Total: {{3}}
Metode pembayaran: {{4}}

Pembayaran menunggu pemeriksaan.
Silakan buka dashboard admin BacaYuk.
```

Server mengirim parameter sebagai nomor pesanan, nama produk, jumlah pembayaran dalam Rupiah, dan metode pembayaran. URL dashboard tidak dikirim sebagai parameter karena tombol template menggunakan URL statis.

Gunakan contoh parameter yang tidak menyerupai data pribadi nyata saat mengirim template untuk ditinjau, misalnya:

```text
{{1}} = BY-TEST-001
{{2}} = VIP BacaYuk 1 bulan
{{3}} = Rp 100.000
{{4}} = QRIS
```

Template belum dapat dikirim selama statusnya `Sedang ditinjau`. Tunggu sampai Meta menampilkan status `Disetujui` atau `Active`, kemudian gunakan tombol **Kirim WA** di Admin Finance untuk mencoba ulang notifikasi yang gagal.

## Template WhatsApp pelanggan

Template pelanggan merupakan kontrak terpisah dari `pesanan_baru_bacayuk`. Template dapat dipilih dari galeri Meta pada kategori Utility yang sesuai, kemudian disesuaikan untuk sedikitnya status berikut:

- pembayaran menunggu atau pengingat pembayaran;
- bukti pembayaran diterima dan sedang diperiksa;
- pembayaran disetujui;
- bukti pembayaran ditolak dan perlu dikirim ulang.

Aplikasi sudah dapat menyimpan beberapa nomor WhatsApp milik user, persetujuan notifikasi transaksi, nomor utama, dan nomor yang dipilih untuk setiap order. Pengiriman notifikasi pelanggan **belum diaktifkan** sampai nama template, bahasa, parameter, status persetujuan Meta, serta verifikasi kepemilikan nomor diselesaikan. Jangan memakai template Admin untuk menghubungi pelanggan.

## Konfigurasi server

Semua variabel berikut harus disimpan sebagai environment variable server. Jangan menggunakan awalan `VITE_` karena token tidak boleh masuk ke browser.

```text
WHATSAPP_CLOUD_API_VERSION=<versi Graph API yang aktif, misalnya vXX.X>
WHATSAPP_CLOUD_API_ACCESS_TOKEN=<system user access token>
WHATSAPP_CLOUD_API_PHONE_NUMBER_ID=<Phone Number ID pengirim>
WHATSAPP_ADMIN_RECIPIENT=62XXXXXXXXXXX
WHATSAPP_PAYMENT_REVIEW_TEMPLATE=pesanan_baru_bacayuk
WHATSAPP_PAYMENT_REVIEW_TEMPLATE_LANGUAGE=id
```

Nomor penerima harus memakai kode negara tanpa tanda `+`. `WHATSAPP_CLOUD_API_PHONE_NUMBER_ID` harus berasal dari WhatsApp Business Account yang sama dengan tempat template dibuat. Setelah environment variable diubah, lakukan redeploy.

## Penanganan error template

Error `(#132001) Template name does not exist in the translation` berarti Meta belum menemukan kombinasi nama template dan bahasa yang diminta. Periksa hal berikut sebelum mencoba ulang:

1. Status template sudah `Disetujui` atau `Active`, bukan `Sedang ditinjau`.
2. Nama environment tepat `pesanan_baru_bacayuk`.
3. Kode bahasa environment tepat `id` dan template memiliki terjemahan Indonesian.
4. Phone Number ID pengirim dan template berada pada WhatsApp Business Account yang sama.
5. Deployment terbaru sudah memuat perubahan environment.

Kegagalan notifikasi hanya mengubah `whatsappNotificationStatus` menjadi `failed`. Bukti pembayaran tetap tersimpan dan order tetap `pending_review`, sehingga Admin masih dapat menyetujui atau menolak pembayaran dari halaman Keuangan.

## Alur operasional

1. Pembeli memilih QRIS atau transfer bank dan membuat pesanan.
2. Pembeli membayar lalu mengunggah bukti.
3. Server menyimpan bukti, mengubah status menjadi `pending_review`, dan mengirim template WhatsApp.
4. Admin membuka halaman Keuangan melalui tombol statis dalam template, memeriksa bukti dan mutasi, lalu memilih Setujui atau Tolak.
5. Persetujuan membuat hak buku atau VIP secara atomik di database.
6. Halaman pembeli memeriksa status setiap 10 detik dan membuka akses setelah pesanan menjadi `paid`.

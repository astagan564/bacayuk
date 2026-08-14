# Notifikasi pembayaran WhatsApp BacaYuk

Notifikasi dikirim setelah pembeli mengunggah bukti pembayaran. Kegagalan WhatsApp tidak membatalkan unggahan bukti. Status dan tombol kirim ulang tersedia di Admin BacaYuk pada halaman Keuangan.

## Template WhatsApp

Buat template kategori `UTILITY` dengan nama `bacayuk_payment_review` dan bahasa Indonesia. Isi body harus menggunakan enam parameter dalam urutan berikut:

```text
Pembayaran BacaYuk perlu diperiksa.

Pembeli: {{1}}
Jumlah: {{2}}
Produk: {{3}}
Metode: {{4}}
Pesanan: {{5}}

Buka halaman admin: {{6}}
```

Parameter dikirim server sebagai nama pembeli, jumlah pembayaran, nama produk, metode pembayaran, nomor pesanan, dan URL halaman admin.

## Konfigurasi server

Semua variabel berikut harus disimpan sebagai environment variable server. Jangan menggunakan awalan `VITE_` karena token tidak boleh masuk ke browser.

```text
WHATSAPP_CLOUD_API_VERSION=<versi Graph API yang aktif, misalnya vXX.X>
WHATSAPP_CLOUD_API_ACCESS_TOKEN=<system user access token>
WHATSAPP_CLOUD_API_PHONE_NUMBER_ID=<Phone Number ID pengirim>
WHATSAPP_ADMIN_RECIPIENT=62XXXXXXXXXXX
WHATSAPP_PAYMENT_REVIEW_TEMPLATE=bacayuk_payment_review
WHATSAPP_PAYMENT_REVIEW_TEMPLATE_LANGUAGE=id
WHATSAPP_ADMIN_REVIEW_URL=https://bacayuk.web.id/admin/finance
```

Nomor penerima harus memakai kode negara tanpa tanda `+`. Setelah environment variable diubah, lakukan redeploy.

## Alur operasional

1. Pembeli memilih QRIS atau transfer bank dan membuat pesanan.
2. Pembeli membayar lalu mengunggah bukti.
3. Server menyimpan bukti, mengubah status menjadi `pending_review`, dan mengirim template WhatsApp.
4. Admin membuka halaman Keuangan melalui tautan dalam pesan, memeriksa bukti dan mutasi, lalu memilih Setujui atau Tolak.
5. Persetujuan membuat hak buku atau VIP secara atomik di database.
6. Halaman pembeli memeriksa status setiap 10 detik dan membuka akses setelah pesanan menjadi `paid`.

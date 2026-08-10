## Buku AI dan pengalaman membaca baru - 2026-08-10

### Membuat buku kini jauh lebih sederhana
- Admin cukup menulis ide atau naskah singkat, memilih usia pembaca, dan menentukan bahasa utama.
- BacaYuk menyiapkan draft yang bisa diperiksa terlebih dahulu, termasuk judul, pembagian halaman, arahan gambar, glosarium, dan calon kuis.
- Cover dan gambar halaman dapat dibuat berurutan. Jika proses terhenti, gambar yang sudah selesai tetap tersimpan dan proses bisa dilanjutkan.
- Status buku kini menunjukkan apakah naskah, cover, dan seluruh ilustrasinya benar-benar sudah siap.

### Tampilan membaca seperti buku cerita
- Satu halaman cerita sekarang tampil sebagai satu buku terbuka: ilustrasi penuh di kiri dan naskah di kanan.
- Tombol Kuis, Rekam, Baca, Tandai, dan navigasi halaman dipindahkan ke luar buku agar tidak menutupi ilustrasi atau teks.
- Di HP, ilustrasi tampil di atas dan teks berada di bawah agar tetap lega dan mudah dibaca.

### Bahasa Inggris dan kuis lebih baik
- Terjemahan sekarang mencakup judul buku, judul setiap halaman, dan isi cerita.
- Saat mode Inggris aktif, tombol Baca menggunakan suara bahasa Inggris.
- Jawaban benar pada kuis kosakata tidak lagi selalu berada di pilihan pertama dan akan disusun ulang saat kuis dicoba kembali.

### Cover dan ilustrasi lebih bersih
- Cover buku yang tersimpan sekarang tampil pada kartu buku di halaman depan.
- Generator ilustrasi tidak lagi menerima judul dan naskah mentah, sehingga risiko tulisan yang tidak diperlukan muncul di dalam gambar menjadi jauh lebih kecil.
- Larangan huruf, angka, caption, balon percakapan, label, logo, dan watermark kini selalu disertakan saat membuat gambar.

## Pembaruan UI - 2026-08-08

### Admin tambah buku sudah lebih lengkap
- Buku yang ditambah dari admin kini bisa disimpan ke database Supabase, dengan cadangan lokal bila koneksi database bermasalah.
- Admin bisa mengatur status Draft atau Published agar buku baru tidak langsung tampil sebelum siap.
- Form buku sekarang punya validasi, preview cover, tambah/duplikat/hapus halaman, editor elemen interaktif, dan kuis mini per halaman.
- Harga dan judul buku baru akan dipakai saat proses pembelian e-book.

### Mode baca lebih nyaman di HP dan tablet
- Tampilan membaca sekarang lebih mengutamakan 1 halaman di layar kecil agar cerita tidak terasa sempit.
- Tombol lanjut, kembali, daftar halaman, rekam suara, unduh offline, bahasa, tema, dan ukuran teks dibuat lebih mudah disentuh.
- Panel alat baca di HP dibuat lebih rapi sehingga orang tua tidak perlu mencari tombol kecil-kecil saat mendampingi anak.
- Daftar halaman kini tampil seperti lembar pilihan yang lebih nyaman dibuka di HP maupun tablet.

### Header dan footer lebih rapi
- Saat anak sedang membaca, footer tidak lagi muncul memanjang setelah halaman digulir.
- Tombol di navbar mode baca disederhanakan agar toggle tema tetap terlihat di layar HP.
- Logo BacaYuk di halaman depan kini tidak lagi terpotong oleh tombol akun orang tua, notifikasi, atau tombol lain di layar sempit.

### Tampilan dark mode lebih konsisten
- Banner promo, kartu atas, modal, kuis, statistik, rekam suara, pengingat istirahat, changelog, dan panel admin sekarang memakai warna gelap yang lebih seragam.
- Teks di dark mode dibuat lebih jelas agar tetap nyaman dibaca anak dan orang tua.
- Panel lama yang terlalu terang atau terlalu ungu/amber sudah dirapikan agar sesuai dengan tema perpustakaan BacaYuk.

### Pengalaman membaca dan pengelolaan lebih rapi
- Tombol utama, tombol sekunder, garis pembatas, kartu lembut, dan input form kini mengikuti gaya visual yang sama.
- Form editor buku di admin dashboard dibuat lebih nyaman dipakai di dark mode.
- Beberapa warna internal yang tidak valid sudah dibersihkan agar tampilan tidak berubah-ubah setelah build.

## [0.0.1] - 2026-08-08

### Fitur Baru
- **Buku Jadi Lebih Nyata**: Anak-anak kini bisa membaca buku dengan efek membalik halaman 3D yang interaktif dan menyenangkan.
- **Baca Otomatis**: Tersedia fitur suara otomatis yang dapat membacakan cerita untuk anak.
- **Rekam Suara Bunda/Ayah**: Orang tua bisa merekam suara sendiri untuk setiap halaman cerita.
- **2 Bahasa Sekaligus**: Cerita bisa dibaca dalam bahasa Indonesia, Inggris, atau keduanya sekaligus.
- **Kuis Seru**: Ada mini-game kosa kata bahasa Inggris di akhir cerita untuk melatih ingatan anak.
- **Baca Tanpa Internet**: Buku bisa diunduh agar dapat dibaca kapan saja.
- **Pengingat Istirahat Mata**: Aplikasi akan mengingatkan anak untuk istirahat setelah membaca terlalu lama.
- **Pengaturan Orang Tua**: Area khusus untuk mengatur durasi istirahat dan pertanyaan keamanan.

### Peningkatan
- Tampilan membaca di komputer/laptop sekarang jauh lebih rapi dengan tombol-tombol yang mudah dijangkau di sisi kanan.
- Buku 1 halaman sekarang tampil lebih bersih dan lega.

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  Mail,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import bacayukLogo from '@/assets/bacayuk-logo.svg';

const LAST_UPDATED = '13 Agustus 2026';
const CONTACT_EMAIL = import.meta.env.VITE_LEGAL_CONTACT_EMAIL || 'privacy@bacayuk.web.id';

const sections = [
  ['ringkasan', 'Ringkasan'],
  ['privacy', 'Kebijakan Privasi'],
  ['data', 'Data yang diproses'],
  ['penggunaan', 'Penggunaan data'],
  ['mitra', 'Penyedia layanan'],
  ['anak', 'Perlindungan anak'],
  ['hak', 'Hak pengguna'],
  ['hapus-data', 'Hapus akun & data'],
  ['terms', 'Ketentuan Layanan'],
  ['pembayaran', 'Pembayaran & unduhan'],
  ['kontak', 'Kontak'],
] as const;

function SectionTitle({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 border-b border-default pb-4">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-green">{eyebrow}</p>
      <h2 className="mb-0 text-2xl sm:text-3xl">{children}</h2>
    </div>
  );
}

export function LegalPage() {
  return (
    <div className="min-h-screen bg-background text-primary">
      <header className="sticky top-0 z-40 border-b border-default bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" aria-label="BacaYuk — kembali ke beranda" className="shrink-0 transition-opacity hover:opacity-85">
            <img src={bacayukLogo} alt="BacaYuk" className="h-9 w-auto sm:h-10" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-default bg-card px-3 py-2 text-xs font-bold text-secondary transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke beranda
          </Link>
        </div>
      </header>

      <main>
        <section className="border-b border-default bg-[linear-gradient(135deg,color-mix(in_srgb,var(--story-green)_14%,var(--bg-primary)),var(--bg-primary)_55%,color-mix(in_srgb,var(--magic-blue)_12%,var(--bg-primary)))]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="max-w-4xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-3 py-1.5 text-xs font-extrabold text-brand-green">
                <ShieldCheck className="h-4 w-4" />
                Informasi hukum dan privasi keluarga
              </div>
              <h1 className="max-w-3xl text-4xl leading-[1.06] sm:text-6xl">
                Jelas tentang data. Adil dalam layanan.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-secondary sm:text-lg">
                Halaman ini menjelaskan data yang diproses BacaYuk, cara kami menggunakannya, aturan penggunaan buku, pembayaran, serta cara orang tua meminta penghapusan akun dan data.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-secondary">
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> Diperbarui {LAST_UPDATED}</span>
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 text-brand-green hover:underline">
                  <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-14">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <nav aria-label="Daftar isi halaman legal" className="book-panel rounded-2xl p-3">
              <p className="px-3 pb-2 pt-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">Daftar isi</p>
              {sections.map(([id, label]) => (
                <a key={id} href={`#${id}`} className="block rounded-xl px-3 py-2 text-xs font-bold text-secondary transition-colors hover:bg-surface-hover hover:text-primary">
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="min-w-0 space-y-8 leading-7 text-secondary">
            <section id="ringkasan" className="scroll-mt-24 book-panel rounded-3xl p-5 sm:p-8">
              <SectionTitle eyebrow="Versi singkat">Hal terpenting untuk diketahui</SectionTitle>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  [UserRoundCheck, 'Akun orang tua', 'Login menggunakan Google atau Facebook. Anak tidak perlu membuat akun media sosial.'],
                  [Database, 'Data seperlunya', 'Kami menggunakan identitas dasar, aktivitas membaca, dan catatan transaksi untuk menjalankan layanan.'],
                  [Trash2, 'Bisa diminta hapus', 'Orang tua dapat meminta penghapusan akun dan data, dengan pengecualian catatan yang wajib disimpan menurut hukum.'],
                ].map(([Icon, title, text]) => {
                  const ItemIcon = Icon as typeof ShieldCheck;
                  return (
                    <div key={String(title)} className="reader-soft-panel rounded-2xl p-4">
                      <ItemIcon className="mb-3 h-5 w-5 text-brand-green" />
                      <h3 className="mb-1 text-sm font-extrabold text-primary">{String(title)}</h3>
                      <p className="text-xs leading-6">{String(text)}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section id="privacy" className="scroll-mt-24 book-panel rounded-3xl p-5 sm:p-8">
              <SectionTitle eyebrow="Kebijakan Privasi">Siapa yang mengelola data</SectionTitle>
              <p>
                BacaYuk adalah layanan buku cerita anak interaktif yang tersedia melalui <strong className="text-primary">www.bacayuk.web.id</strong>. Dalam kebijakan ini, “BacaYuk”, “kami”, dan “layanan” merujuk pada pengelola aplikasi BacaYuk.
              </p>
              <p className="mt-4">
                Kebijakan ini berlaku untuk katalog, pembaca buku, akun orang tua, pembayaran, unduhan, serta fitur administrasi dan pembuatan buku. Dengan memakai BacaYuk, pengguna menyatakan telah membaca kebijakan ini.
              </p>
            </section>

            <section id="data" className="scroll-mt-24 book-panel rounded-3xl p-5 sm:p-8">
              <SectionTitle eyebrow="Data pribadi">Data yang kami proses</SectionTitle>
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-primary">1. Data akun orang tua</h3>
                  <p>Ketika login melalui Google atau Facebook, kami menerima pengenal akun, nama, alamat email, penyedia login, dan—jika tersedia—foto profil dasar. BacaYuk tidak menerima kata sandi Google atau Facebook.</p>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-primary">2. Aktivitas membaca</h3>
                  <p>Kami dapat memproses buku yang dibuka, halaman terakhir, status selesai, waktu membaca, favorit, dan penanda halaman. Sebagian preferensi, rekaman suara orang tua, serta progres dapat tersimpan hanya di perangkat melalui penyimpanan browser.</p>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-primary">3. Pembayaran dan lisensi unduhan</h3>
                  <p>Kami menyimpan ID order, buku atau paket yang dibeli, nominal, status, metode pembayaran, waktu transaksi, identitas pembeli, status VIP, dan jumlah unduhan. Informasi instrumen pembayaran diproses oleh Midtrans; BacaYuk tidak menyimpan nomor kartu atau PIN pembayaran.</p>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-primary">4. Data teknis dan konten</h3>
                  <p>Server dan penyedia infrastruktur dapat memproses alamat IP, jenis perangkat/browser, waktu akses, serta catatan kesalahan untuk keamanan dan operasional. Materi yang dimasukkan pengelola ke Book Studio dapat diproses oleh layanan AI untuk menghasilkan atau memperbaiki buku.</p>
                </div>
              </div>
            </section>

            <section id="penggunaan" className="scroll-mt-24 book-panel rounded-3xl p-5 sm:p-8">
              <SectionTitle eyebrow="Tujuan">Cara kami menggunakan data</SectionTitle>
              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  'Membuat dan menjaga sesi akun orang tua.',
                  'Menyediakan akses buku sesuai status pengguna.',
                  'Menyimpan progres dan preferensi membaca.',
                  'Memproses pembayaran dan menerbitkan lisensi unduhan.',
                  'Membubuhkan identitas pembeli sebagai watermark pada file.',
                  'Mencegah penyalahgunaan, penipuan, dan akses tanpa izin.',
                  'Menangani dukungan serta permintaan hak data.',
                  'Memperbaiki keamanan, stabilitas, dan kualitas layanan.',
                ].map((item) => (
                  <li key={item} className="reader-soft-panel flex gap-3 rounded-xl p-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm">Kami tidak menjual data pribadi pengguna dan tidak menggunakan data login Google atau Facebook untuk periklanan berbasis profil.</p>
            </section>

            <section id="mitra" className="scroll-mt-24 book-panel rounded-3xl p-5 sm:p-8">
              <SectionTitle eyebrow="Pemroses data">Penyedia layanan terkait</SectionTitle>
              <p>Kami membagikan data hanya sejauh diperlukan agar fungsi terkait berjalan:</p>
              <div className="mt-4 divide-y divide-default rounded-2xl border border-default">
                {[
                  ['Supabase', 'Autentikasi, database, dan penyimpanan aplikasi.'],
                  ['Google dan Meta', 'Penyedia login OAuth; masing-masing memproses data sesuai kebijakannya.'],
                  ['Midtrans', 'Pemrosesan pembayaran dan konfirmasi status transaksi.'],
                  ['Google Gemini', 'Pemrosesan materi Book Studio/AI yang dikirim oleh pengelola saat fitur digunakan.'],
                  ['Vercel', 'Hosting aplikasi, jaringan, dan log operasional.'],
                ].map(([name, use]) => (
                  <div key={name} className="grid gap-1 p-4 sm:grid-cols-[150px_1fr]">
                    <strong className="text-sm text-primary">{name}</strong>
                    <span className="text-sm">{use}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm">Data dapat diproses di lokasi tempat penyedia layanan beroperasi, dengan perlindungan kontraktual dan teknis yang tersedia dari penyedia tersebut.</p>
            </section>

            <section id="anak" className="scroll-mt-24 rounded-3xl border border-brand-gold/35 bg-brand-gold/10 p-5 sm:p-8">
              <SectionTitle eyebrow="Keluarga">Perlindungan anak</SectionTitle>
              <p>
                BacaYuk ditujukan untuk digunakan anak dengan pendampingan orang tua atau wali. Akun, pembelian, dan permintaan data harus dilakukan oleh orang tua/wali. Kami tidak meminta anak membuat akun Google atau Facebook dan tidak bermaksud mengumpulkan data pribadi anak secara langsung.
              </p>
              <p className="mt-4">Jangan memasukkan nama lengkap anak, alamat, sekolah, nomor kontak, atau informasi sensitif lain ke rekaman maupun fitur masukan. Jika orang tua mengetahui data anak terkirim tanpa semestinya, hubungi kami untuk pemeriksaan dan penghapusan.</p>
            </section>

            <section id="hak" className="scroll-mt-24 book-panel rounded-3xl p-5 sm:p-8">
              <SectionTitle eyebrow="Kontrol pengguna">Hak atas data</SectionTitle>
              <p>Pengguna dapat meminta informasi mengenai data yang kami simpan, koreksi, salinan, penghentian pemrosesan tertentu, penarikan persetujuan, atau penghapusan, sepanjang sesuai hukum yang berlaku. Kami dapat meminta verifikasi identitas untuk melindungi akun.</p>
              <p className="mt-4">Permintaan akan ditangani dalam jangka waktu yang wajar dan sesuai kewajiban hukum. Catatan transaksi, pencegahan penipuan, sengketa, atau kewajiban pajak dapat tetap disimpan selama diwajibkan.</p>
            </section>

            <section id="hapus-data" className="scroll-mt-24 overflow-hidden rounded-3xl border border-brand-rose/35 bg-card">
              <div className="border-b border-brand-rose/25 bg-brand-rose/10 p-5 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-rose text-white"><Trash2 className="h-5 w-5" /></span>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-rose">Penghapusan data pengguna</p>
                    <h2 className="mb-0 mt-1 text-2xl sm:text-3xl">Cara mengunduh atau menghapus data</h2>
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-8">
                <ol className="space-y-5">
                  {[
                    ['Buka pengaturan orang tua', <>Masuk ke akun, lalu buka <a className="font-bold text-brand-green underline" href="/settings">Pengaturan Orang Tua</a>. Pilih “Unduh data saya” untuk memperoleh salinan JSON.</>],
                    ['Konfirmasi penghapusan', 'Pada bagian Hapus akun permanen, masukkan email akun dan frasa konfirmasi yang diminta. Jangan pernah mengirim kata sandi atau kode OTP.'],
                    ['Proses otomatis', 'Sesi di semua perangkat dicabut, lalu profil, aktivitas membaca, dan hak akses dihapus. Catatan transaksi yang perlu dipertahankan akan dianonimkan.'],
                    ['Bantuan alternatif', <>Jika akun tidak dapat diakses, hubungi <a className="font-bold text-brand-green underline" href={`mailto:${CONTACT_EMAIL}?subject=Permintaan%20Penghapusan%20Data%20BacaYuk`}>{CONTACT_EMAIL}</a> dari alamat email akun.</>],
                  ].map(([title, body], index) => (
                    <li key={String(title)} className="grid grid-cols-[32px_1fr] gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-rose/15 text-xs font-black text-brand-rose">{index + 1}</span>
                      <div><h3 className="text-sm font-extrabold text-primary">{title}</h3><p className="mt-1 text-sm">{body}</p></div>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 rounded-2xl bg-surface p-4 text-sm">
                  <strong className="text-primary">Data pada perangkat:</strong> gunakan tombol “Bersihkan data perangkat” di Pengaturan Orang Tua untuk menghapus preferensi, bookmark, progres lokal, cache, dan rekaman suara. Menghapus koneksi BacaYuk dari Google/Facebook tidak otomatis menghapus data yang tersimpan di BacaYuk.
                </div>
              </div>
            </section>

            <section id="terms" className="scroll-mt-24 book-panel rounded-3xl p-5 sm:p-8">
              <SectionTitle eyebrow="Ketentuan Layanan">Aturan penggunaan BacaYuk</SectionTitle>
              <div className="space-y-5">
                <div><h3 className="text-base font-extrabold text-primary">Akun dan pengawasan</h3><p>Orang tua/wali bertanggung jawab menjaga akses akun dan mendampingi penggunaan oleh anak. Pengguna wajib memberikan informasi yang benar dan tidak menyalahgunakan akun orang lain.</p></div>
                <div><h3 className="text-base font-extrabold text-primary">Hak atas konten</h3><p>Buku, ilustrasi, audio, merek, dan materi BacaYuk dilindungi hak kekayaan intelektual. Akses diberikan untuk penggunaan pribadi dan keluarga, bukan untuk dijual kembali, didistribusikan massal, diunggah ulang, atau digunakan sebagai bahan pelatihan sistem lain tanpa izin tertulis.</p></div>
                <div><h3 className="text-base font-extrabold text-primary">Ketersediaan layanan</h3><p>Kami berupaya menjaga layanan tetap tersedia, tetapi tidak menjamin tanpa gangguan. Fitur dapat diperbaiki, diganti, dibatasi, atau dihentikan untuk keamanan, kepatuhan, dan pengembangan produk.</p></div>
                <div><h3 className="text-base font-extrabold text-primary">Penggunaan yang dilarang</h3><p>Pengguna dilarang membobol sistem, melewati pembatasan akses, memalsukan pembayaran, menghapus watermark, menyalin konten secara tidak sah, mengirim materi berbahaya, atau mengganggu pengguna dan layanan lain.</p></div>
                <div><h3 className="text-base font-extrabold text-primary">Batas tanggung jawab</h3><p>BacaYuk merupakan layanan literasi pendamping dan bukan pengganti nasihat pendidikan, medis, atau profesional. Sepanjang diizinkan hukum, tanggung jawab kami dibatasi pada kerugian langsung yang terbukti terkait layanan.</p></div>
              </div>
            </section>

            <section id="pembayaran" className="scroll-mt-24 book-panel rounded-3xl p-5 sm:p-8">
              <SectionTitle eyebrow="Transaksi">Pembayaran, VIP, dan unduhan</SectionTitle>
              <ul className="space-y-3 text-sm">
                <li><strong className="text-primary">Pembelian buku:</strong> membuka lisensi unduhan untuk buku yang dipilih sesuai harga yang tampil saat checkout.</li>
                <li><strong className="text-primary">VIP:</strong> membuka unduhan semua buku selama masa langganan aktif dan dapat mencakup fitur tambahan yang ditandai tersedia.</li>
                <li><strong className="text-primary">Konfirmasi:</strong> akses diterbitkan setelah pembayaran diverifikasi oleh server dan Midtrans.</li>
                <li><strong className="text-primary">Unduhan:</strong> file bersifat pribadi, dapat diberi watermark identitas pembeli, serta tunduk pada batas waktu/jumlah unduhan yang ditampilkan.</li>
                <li><strong className="text-primary">Pengembalian dana:</strong> permintaan ditinjau berdasarkan status transaksi, apakah akses/file telah digunakan, gangguan layanan yang terbukti, serta hukum perlindungan konsumen yang berlaku.</li>
                <li><strong className="text-primary">Harga:</strong> harga dan promosi dapat berubah untuk transaksi berikutnya; jumlah final selalu ditampilkan sebelum pengguna membayar.</li>
              </ul>
            </section>

            <section id="kontak" className="scroll-mt-24 rounded-3xl bg-brand-green p-6 text-white sm:p-8">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/70">Pertanyaan dan hak data</p>
                  <h2 className="mb-2 mt-1 text-2xl text-white sm:text-3xl">Hubungi pengelola BacaYuk</h2>
                  <p className="max-w-2xl text-sm leading-6 text-white/85">Sampaikan pertanyaan privasi, masalah transaksi, atau permintaan penghapusan dengan alamat email akun agar kami dapat membantu dengan aman.</p>
                </div>
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-[#246f54] shadow-sm transition-transform hover:-translate-y-0.5">
                  <Mail className="h-4 w-4" /> Kirim email
                </a>
              </div>
            </section>

            <div className="flex flex-col gap-3 rounded-2xl border border-default p-4 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span>Dokumen ini dapat diperbarui ketika layanan atau ketentuan hukum berubah.</span>
              <a href="https://www.bacayuk.web.id/legal" className="inline-flex items-center gap-1 font-bold text-brand-green hover:underline">
                www.bacayuk.web.id/legal <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}

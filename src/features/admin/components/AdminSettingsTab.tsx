import type { FormEvent } from 'react';
import type { AdminSettings,TransactionRecord } from '@/utils/adminStore'; import {adminStore} from '@/utils/adminStore'; import {CheckCircle2,Clock,Megaphone,RefreshCw} from 'lucide-react';
interface Props{settings:AdminSettings;cronStatus:string|null;onSettingsChange:(s:AdminSettings)=>void;onCronStatusChange:(s:string|null)=>void;onTransactionsChange:(t:TransactionRecord[])=>void;onSubmit:(e:FormEvent)=>void;onToast:(m:string)=>void}
export function AdminSettingsTab({settings,cronStatus,onSettingsChange:setSettings,onCronStatusChange:setCronStatus,onTransactionsChange:setTransactions,onSubmit:handleSaveSettings,onToast:showToast}:Props){return(
<form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
  <div className="p-4 rounded-2xl border-2 border-default bg-surface flex flex-col gap-4">
    <h3 className="text-base font-black flex items-center gap-2">
      <Clock className="w-5 h-5 text-warning" />
      <span>Pengaturan Kesehatan Anak & Waktu Aturan "20-20-20"</span>
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
      <div>
        <label className="font-bold text-secondary block mb-1">
          Interval Pengingat Istirahat Mata Anak (Menit)
        </label>
        <input
          type="number"
          min={5}
          max={60}
          value={settings.eyeRestIntervalMinutes}
          onChange={(e) =>
            setSettings({ ...settings, eyeRestIntervalMinutes: Number(e.target.value) })
          }
          className="w-full px-3 py-2 rounded-xl border border-default bg-background font-bold"
        />
        <p className="text-[11px] text-muted mt-1">
          Sistem akan secara otomatis memunculkan animasi pengingat istirahat mata setiap {settings.eyeRestIntervalMinutes} menit membaca tanpa henti.
        </p>
      </div>

      <div>
        <label className="font-bold text-secondary block mb-1">
          Batas Waktu Masa Aktif Link Unduh E-Book (Jam)
        </label>
        <input
          type="number"
          min={1}
          max={168}
          value={settings.downloadLinkExpireHours}
          onChange={(e) =>
            setSettings({ ...settings, downloadLinkExpireHours: Number(e.target.value) })
          }
          className="w-full px-3 py-2 rounded-xl border border-default bg-background font-bold"
        />
        <p className="text-[11px] text-muted mt-1">
          Link unduhan PDF & EPUB setelah pembelian akan otomatis hangus setelah {settings.downloadLinkExpireHours} jam.
        </p>
      </div>

      <div>
        <label className="font-bold text-secondary block mb-1">
          Harga Standar E-Book Unduhan Offline (Rp)
        </label>
        <input
          type="number"
          step={1000}
          value={settings.defaultEbookPrice}
          onChange={(e) =>
            setSettings({ ...settings, defaultEbookPrice: Number(e.target.value) })
          }
          className="w-full px-3 py-2 rounded-xl border border-default bg-background font-bold"
        />
      </div>

      <div className="flex flex-col justify-center">
        <label className="font-bold text-secondary block mb-1">
          Perlindungan Hak Cipta (Social Watermarking)
        </label>
        <label className="flex items-center gap-2 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={settings.enableGlobalWatermark}
            onChange={(e) =>
              setSettings({ ...settings, enableGlobalWatermark: e.target.checked })
            }
            className="w-4 h-4 text-warning rounded focus:ring-warning"
          />
          <span className="font-bold text-xs text-primary">
            Otomatis sematkan stempel Lisensi Resmi dengan Nama & Email pembeli pada file PDF/EPUB
          </span>
        </label>
      </div>

      {/* Anti-Right Click & Copy Protection Toggle */}
      <div className="reader-soft-panel flex flex-col justify-center col-span-1 md:col-span-2 p-3 rounded-xl">
        <label className="font-bold text-secondary block mb-1">
          🔒 Fitur Anti-Right Click & Copy Protection (Perlindungan Konten E-Book)
        </label>
        <label className="flex items-center gap-2 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={settings.enableCopyProtection ?? true}
            onChange={(e) =>
              setSettings({ ...settings, enableCopyProtection: e.target.checked })
            }
            className="w-4 h-4 text-warning rounded focus:ring-warning"
          />
          <span className="font-bold text-xs text-primary">
            Aktifkan pencegahan Klik Kanan, Blokir Kombinasi Tombol Ctrl+S / Inspect Element, & Matikan Seleksi Teks saat anak membaca cerita.
          </span>
        </label>
      </div>

      {/* Promo Banner Settings */}
      <div className="reader-soft-panel col-span-1 md:col-span-2 p-4 rounded-xl flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="font-black text-primary flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-brand-blue shrink-0" />
            <span>Manajemen Spanduk / Banner Pengumuman Promo Katalog</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={settings.promoBannerActive ?? true}
              onChange={(e) =>
                setSettings({ ...settings, promoBannerActive: e.target.checked })
              }
              className="w-4 h-4 text-brand-blue rounded focus:ring-brand-blue"
            />
            <span className="font-bold text-xs text-secondary">
              Tampilkan Banner
            </span>
          </label>
        </div>
        <input
          type="text"
          value={settings.promoBannerText ?? ''}
          onChange={(e) =>
            setSettings({ ...settings, promoBannerText: e.target.value })
          }
          placeholder="Contoh: 🎉 Promo Hari Anak: Diskon Unduhan 50% dengan Kupon BUKUANAK20!"
          className="w-full px-3 py-2 rounded-xl border border-default bg-background font-bold text-xs text-primary"
        />
        <p className="text-[11px] text-secondary">
          Spanduk pengumuman promo akan muncul di halaman katalog utama e-book tanpa perlu mengubah kode web.
        </p>
      </div>

      {/* Cron Job Cleanup Tool */}
      <div className="reader-soft-panel col-span-1 md:col-span-2 p-4 rounded-xl flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-brand-blue animate-spin-slow" />
              <span>Pembersihan Link Kedaluwarsa Otomatis (Cron Job Engine)</span>
            </h4>
            <p className="text-[11px] text-secondary">
              Sistem cron job di latar belakang otomatis menghapus file sementara watermark & menandai link transaksi yang lewat {settings.downloadLinkExpireHours} jam.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const res = adminStore.runCronJobCleanup();
              setCronStatus(`[${res.timestamp}] ${res.message}`);
              showToast(`🧹 Pembersihan Cron Job berhasil! ${res.purgedCount} link kedaluwarsa dibersihkan.`);
              setTransactions(adminStore.getTransactions());
            }}
            className="px-4 py-2 rounded-xl bg-brand-blue hover:opacity-90 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Jalankan Cron Pembersihan Otomatis Sekarang</span>
          </button>
        </div>

        {cronStatus && (
          <div className="p-2.5 rounded-lg bg-success/10 border border-success/30 text-brand-green dark:text-brand-green text-[11px] font-bold">
            {cronStatus}
          </div>
        )}
      </div>
    </div>
  </div>

  <button
    type="submit"
    className="w-full py-3.5 px-6 rounded-2xl bg-brand-blue hover:opacity-90 text-white font-black text-sm shadow-md transition-transform hover:scale-[1.01] flex items-center justify-center gap-2"
  >
    <CheckCircle2 className="w-5 h-5" />
    <span>Simpan Semua Pengaturan Sistem Global</span>
  </button>
</form>
);}


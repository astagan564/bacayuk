import type {Story} from '@/types';import{adminStore}from '@/utils/adminStore';import{TrendingUp}from'lucide-react';
export function AnalyticsTab({stories}:{stories:Story[]}){return(
<div className="flex flex-col gap-6">
  <div className="p-4 rounded-2xl bg-brand-blue text-white shadow-xl flex items-center justify-between flex-wrap gap-4">
    <div>
      <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold flex items-center gap-1">
        <TrendingUp className="w-3.5 h-3.5" />
        <span>Evaluasi Bisnis & Daya Tarik Konten</span>
      </span>
      <h3 className="text-xl font-black">Analisis Retensi Membaca (Drop-off Analytics)</h3>
      <p className="text-xs text-white/80 mt-1 max-w-2xl">
        Laporan statistik per-halaman untuk mengetahui di halaman berapa anak-anak berhenti/meninggalkan bacaan, sehingga penulis/desainer dapat merevisi bagian cerita yang kurang menarik.
      </p>
    </div>
  </div>

  {/* Stories Drop-off Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {adminStore.getDropoffAnalytics(stories).map((analytics) => (
      <div
        key={analytics.storyId}
        className="p-5 rounded-2xl border-2 border-default bg-surface shadow-md flex flex-col gap-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-default pb-3">
          <div>
            <h4 className="font-black text-base text-primary">
              {analytics.storyTitle}
            </h4>
            <div className="text-xs text-secondary font-semibold flex flex-wrap items-center gap-2 mt-0.5">
              <span>Total Pembaca: <strong>{analytics.totalReaders} Anak</strong></span>
              <span>•</span>
              <span>Selesai: <strong>{analytics.completedCount} Anak ({analytics.completionRate}%)</strong></span>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ${
              analytics.completionRate >= 70
                ? 'bg-success/20 text-success'
                : analytics.completionRate >= 40
                ? 'bg-warning/20 text-warning'
                : 'bg-error/20 text-error'
            }`}
          >
            {analytics.completionRate >= 70 ? '🌟 Sangat Disukai' : analytics.completionRate >= 40 ? '👍 Cukup Menarik' : '⚠️ Perlu Revisi'}
          </span>
        </div>

        {/* Hotspot Drop-off Alert */}
        <div className="p-3 rounded-xl bg-surface border border-default flex items-center gap-3 text-xs">
          <div className="p-2 rounded-lg bg-warning/20 text-warning font-black">
            Halaman {analytics.biggestDropPage}
          </div>
          <div>
            <div className="font-black text-primary">
              Titik Drop-off Terbesar
            </div>
            <div className="text-[11px] text-secondary">
              Sebagian besar pembaca berhenti di <strong>Halaman {analytics.biggestDropPage}</strong> dari total {analytics.totalPages} halaman. Disarankan merevisi ilustrasi / kalimat di halaman ini.
            </div>
          </div>
        </div>

        {/* Page-by-Page Reading Funnel */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-xs font-black text-secondary">
            Grafik Corong Retensi Per Halaman:
          </span>
          <div className="flex flex-col gap-1 text-[11px] font-bold">
            {analytics.pageCounts.map((count, idx) => {
              const pct = Math.round((count / analytics.totalReaders) * 100);
              return (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-secondary">Hal {idx + 1}</span>
                  <div className="flex-1 h-3.5 bg-surface  rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 70 ? 'bg-success' : pct >= 40 ? 'bg-warning' : 'bg-error'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right shrink-0 text-secondary font-black">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
);}


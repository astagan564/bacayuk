import React, { useState, useEffect } from 'react';
import { Story, StoryPage } from '../types';
import {
  adminStore,
  AdminSettings,
  DiscountCoupon,
  TransactionRecord,
  UserReadingActivity,
} from '../utils/adminStore';
import { userAuthStore, UserAccount } from '../utils/userAuthStore';
import {
  X,
  BookOpen,
  Users,
  CreditCard,
  Settings,
  Plus,
  Trash2,
  Edit,
  Download,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Tag,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Upload,
  Eye,
  RefreshCw,
  Sparkles,
  Search,
  Check,
  AlertCircle,
  Megaphone,
  Languages,
} from 'lucide-react';

interface AdminDashboardProps {
  stories: Story[];
  onUpdateStories: (updatedStories: Story[]) => void;
  onBackToHome: () => void;
  isNight?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stories,
  onUpdateStories,
  onBackToHome,
  isNight = false,
}) => {
  const [activeTab, setActiveTab] = useState<'cms' | 'users' | 'finance' | 'settings' | 'analytics'>('cms');
  const [cronStatus, setCronStatus] = useState<string | null>(null);

  // Admin Settings State
  const [settings, setSettings] = useState<AdminSettings>(() => adminStore.getSettings());
  // Coupons State
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(() => adminStore.getCoupons());
  // Transactions State
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => adminStore.getTransactions());
  // Reading Logs
  const [readingLogs, setReadingLogs] = useState<UserReadingActivity[]>(() => adminStore.getReadingLogs());

  // Demo user accounts list
  const [userList, setUserList] = useState<UserAccount[]>(() => {
    const current = userAuthStore.getUser();
    const demoAccounts: UserAccount[] = [
      {
        id: 'usr_g_8812',
        name: 'Bunda Sarah',
        email: 'sarah.bunda@gmail.com',
        phone: '081298765432',
        loginMethod: 'google',
        createdAt: '2026-08-01T10:15:00Z',
      },
      {
        id: 'usr_wa_9941',
        name: 'Ayah Budi',
        email: 'budi.santoso@yahoo.com',
        phone: '081311223344',
        loginMethod: 'whatsapp',
        createdAt: '2026-08-03T14:22:00Z',
      },
      {
        id: 'usr_em_1204',
        name: 'Bunda Ratna',
        email: 'ratna.dewi@gmail.com',
        phone: '085712345678',
        loginMethod: 'email',
        createdAt: '2026-08-05T09:05:00Z',
      },
    ];

    if (current && !demoAccounts.some((a) => a.id === current.id || a.email === current.email)) {
      demoAccounts.unshift(current);
    }
    return demoAccounts;
  });

  // Story Uploader / Editor Modal State
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isNewStory, setIsNewStory] = useState(false);

  // New Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed'>('percent');
  const [newCouponValue, setNewCouponValue] = useState(20);
  const [showCouponForm, setShowCouponForm] = useState(false);

  // Toast / Feedback message
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Finance Filter
  const [financeTimeframe, setFinanceTimeframe] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');

  // Search queries
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [trxSearchQuery, setTrxSearchQuery] = useState('');

  // Handle saving global admin settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    adminStore.saveSettings(settings);
    showToast('⚙️ Pengaturan sistem & kesehatan anak berhasil diperbarui!');
  };

  // Handle editing/saving story in CMS
  const handleSaveStoryCMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory) return;

    let updatedList: Story[];
    if (isNewStory) {
      updatedList = [editingStory, ...stories];
      showToast(`📚 Buku baru "${editingStory.title}" berhasil ditambahkan!`);
    } else {
      updatedList = stories.map((s) => (s.id === editingStory.id ? editingStory : s));
      showToast(`📝 Perubahan pada "${editingStory.title}" berhasil disimpan!`);
    }

    onUpdateStories(updatedList);
    setEditingStory(null);
  };

  // Handle Adding New Coupon
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    const code = newCouponCode.trim().toUpperCase();
    const newCoupon: DiscountCoupon = {
      code,
      type: newCouponType,
      value: Number(newCouponValue),
      usageCount: 0,
      isActive: true,
    };

    const updated = [newCoupon, ...coupons];
    setCoupons(updated);
    adminStore.saveCoupons(updated);
    setNewCouponCode('');
    setShowCouponForm(false);
    showToast(`🏷️ Kupon diskon ${code} berhasil dibuat!`);
  };

  // Toggle Coupon Active Status
  const handleToggleCoupon = (code: string) => {
    const updated = coupons.map((c) => (c.code === code ? { ...c, isActive: !c.isActive } : c));
    setCoupons(updated);
    adminStore.saveCoupons(updated);
  };

  // Delete Coupon
  const handleDeleteCoupon = (code: string) => {
    const updated = coupons.filter((c) => c.code !== code);
    setCoupons(updated);
    adminStore.saveCoupons(updated);
    showToast(`🗑️ Kupon ${code} dihapus.`);
  };

  // Change Transaction Status
  const handleUpdateTrxStatus = (id: string, newStatus: 'success' | 'pending' | 'expired') => {
    adminStore.updateTransactionStatus(id, newStatus);
    const updated = adminStore.getTransactions();
    setTransactions(updated);
    showToast(`💳 Status transaksi #${id} diubah menjadi ${newStatus.toUpperCase()}`);
  };

  // Export Users CSV
  const handleExportUsersCSV = () => {
    const headers = ['ID,Nama,Email,No_WhatsApp,Metode_Login,Tanggal_Daftar'];
    const rows = userList.map((u) =>
      `"${u.id}","${u.name}","${u.email}","${u.phone || '-'}","${u.loginMethod}","${u.createdAt}"`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Database_OrangTua_BukuCerita_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('📥 Berhasil mengekspor database email & WhatsApp orang tua ke CSV!');
  };

  // Calculate Financial Stats
  const successTrxs = transactions.filter((t) => t.status === 'success');
  const pendingTrxs = transactions.filter((t) => t.status === 'pending');
  const totalRevenue = successTrxs.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className={`min-h-screen w-full flex overflow-hidden animate-fade-in ${
      isNight ? 'bg-slate-950 text-slate-100' : 'bg-amber-50 text-amber-950'
    }`}>
      
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-2xl animate-bounce flex items-center gap-2 border-2 border-emerald-300">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Sidebar Menu */}
      <aside className={`w-20 sm:w-72 shrink-0 border-r-2 flex flex-col h-screen ${
        isNight ? 'bg-slate-900 border-indigo-900/80' : 'bg-white border-amber-200'
      }`}>
        <div className="p-4 sm:p-6 border-b-2 border-transparent">
          <div className="flex flex-col gap-2 items-center sm:items-start">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">Panel Kontrol</span>
            </div>
            <h2 className="hidden sm:block text-xl font-black tracking-tight leading-tight">Administrator</h2>
          </div>
        </div>

        <nav className="flex-1 p-2 sm:p-4 flex flex-col gap-2 overflow-y-auto">
          {[
            { id: 'cms', icon: BookOpen, label: 'CMS Buku Cerita' },
            { id: 'users', icon: Users, label: `Pengguna (${userList.length})` },
            { id: 'finance', icon: CreditCard, label: 'Keuangan & Kupon' },
            { id: 'settings', icon: Settings, label: 'Pengaturan Sistem' },
            { id: 'analytics', icon: TrendingUp, label: 'Analisis Retensi' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full py-3 px-3 sm:px-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center sm:justify-start gap-3 ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-amber-950 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-2 sm:p-4 border-t-2 border-transparent mt-auto">
          <button
            onClick={onBackToHome}
            className="w-full py-3 px-3 sm:px-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center sm:justify-start gap-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
            title="Tutup & Kembali"
          >
            <X className="w-5 h-5 shrink-0" />
            <span className="hidden sm:inline">Tutup & Kembali</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto p-6 sm:p-10 relative">
        <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-20">

        {/* TAB 1: CONTENT MANAGEMENT SYSTEM (CMS) */}
        {activeTab === 'cms' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black">Katalog Buku Cerita ({stories.length})</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Atur status akses ("Gratis Tanpa Login", "Gratis Setelah Login", "Berbayar"), batasi unduhan offline, dan terapkan watermark.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingStory({
                    id: `story_${Date.now()}`,
                    title: 'Buku Cerita Baru',
                    author: 'Penulis Cilik',
                    category: 'Petualangan',
                    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
                    coverBg: 'from-amber-400 to-orange-500',
                    themeColor: 'amber',
                    accentColor: 'orange',
                    moralMessage: 'Belajar dan bersabar membawa keberhasilan!',
                    targetAge: '4-8 Tahun',
                    description: 'Kisah seru yang penuh pesan kebaikan untuk anak.',
                    accessStatus: 'free_member',
                    downloadEnabled: true,
                    ebookPrice: 15000,
                    watermarkEnabled: true,
                    pages: [
                      {
                        pageNumber: 1,
                        text: 'Di sebuah desa yang indah, hiduplah seekor anak hewan yang rajin...',
                        illustrationType: 'forest',
                        colors: {
                          bgGradFrom: 'from-emerald-100',
                          bgGradTo: 'to-amber-100',
                          textBg: 'bg-white/80',
                          accentColor: 'emerald',
                          borderAccent: 'border-emerald-300',
                        },
                      },
                    ],
                  });
                  setIsNewStory(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition-transform hover:scale-105 flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Buku Cerita</span>
              </button>
            </div>

            {/* Story Grid CMS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stories.map((story, idx) => {
                const status = story.accessStatus || (idx === 0 ? 'free_guest' : 'free_member');
                const downloadOk = story.downloadEnabled !== false;
                const price = story.ebookPrice || settings.defaultEbookPrice;

                return (
                  <div
                    key={story.id}
                    className="p-4 rounded-2xl border-2 bg-white dark:bg-slate-800 border-amber-200 dark:border-indigo-800 flex items-start gap-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <img
                      src={story.coverImage}
                      alt={story.title}
                      className="w-20 h-28 object-cover rounded-xl shadow-md shrink-0 border border-amber-300"
                    />

                    <div className="flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {status === 'free_guest' && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-400">
                              🔓 Gratis Tanpa Login (1 Buku)
                            </span>
                          )}
                          {status === 'free_member' && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black border border-amber-400">
                              🔑 Gratis Setelah Login
                            </span>
                          )}
                          {status === 'paid' && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-800 dark:text-purple-300 text-[10px] font-black border border-purple-400">
                              💎 Berbayar Online & Offline
                            </span>
                          )}

                          {downloadOk ? (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-800 dark:text-blue-300 text-[10px] font-black">
                              📥 Unduh Rp {price.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-800 dark:text-rose-300 text-[10px] font-black">
                              🚫 Unduh Dikunci
                            </span>
                          )}
                        </div>

                        <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                          {story.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {story.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                          {story.pages.length} Halaman Cerita
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingStory({ ...story, accessStatus: status, downloadEnabled: downloadOk, ebookPrice: price });
                              setIsNewStory(false);
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 hover:bg-amber-500/30 font-bold transition-colors flex items-center gap-1"
                            title="Edit Buku Cerita"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit CMS</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT & READING LOGS */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black">Daftar Orang Tua Terdaftar ({userList.length})</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Pantau data akun orang tua yang telah mendaftar via Google Sign-In, WhatsApp, atau Form Email.
                </p>
              </div>

              <button
                onClick={handleExportUsersCSV}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-transform hover:scale-105 flex items-center gap-2 shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ekspor CSV (Mailchimp/Kirim.Email)</span>
              </button>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama, email, atau nomor WhatsApp..."
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-amber-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* User List Table */}
            <div className="rounded-2xl border border-amber-200 dark:border-indigo-800 overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-amber-100/60 dark:bg-slate-700/80 text-amber-950 dark:text-amber-100 font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Nama Orang Tua</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">No. WhatsApp</th>
                      <th className="p-3">Metode Login</th>
                      <th className="p-3">Tanggal Daftar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 dark:divide-slate-700 font-medium">
                    {userList
                      .filter(
                        (u) =>
                          u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          (u.phone && u.phone.includes(userSearchQuery))
                      )
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-amber-50/50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{u.name}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{u.email}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{u.phone || '-'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold uppercase">
                              {u.loginMethod}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString('id-ID')}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reading Logs Section */}
            <div className="flex flex-col gap-3 pt-4 border-t border-amber-200/50">
              <h3 className="text-base font-black flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Riwayat Aktivitas Membaca (Real-Time Reading Logs)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {readingLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-amber-500/10 dark:bg-slate-800 border border-amber-300 dark:border-indigo-800 flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                      <span>{log.userName}</span>
                      <span className="text-[10px] font-normal text-slate-500">
                        {new Date(log.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 font-semibold truncate">
                      📖 {log.storyTitle}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-500">Halaman {log.lastPageRead} dari {log.totalPages}</span>
                      {log.isCompleted ? (
                        <span className="text-emerald-600 font-black">✔ Selesai Dibaca</span>
                      ) : (
                        <span className="text-amber-600 font-bold">⏳ Sedang Dibaca</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FINANCIAL REPORT & COUPON MANAGER */}
        {activeTab === 'finance' && (
          <div className="flex flex-col gap-6">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-emerald-100 text-xs font-bold">
                  <span>Total Pendapatan E-Book</span>
                  <DollarSign className="w-5 h-5 text-emerald-200" />
                </div>
                <div className="text-2xl sm:text-3xl font-black">
                  Rp {totalRevenue.toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] text-emerald-100 font-medium">
                  Dari {successTrxs.length} transaksi e-book berhasil
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-amber-950 shadow-md flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-amber-900 text-xs font-black">
                  <span>Transaksi Menunggu (Pending)</span>
                  <Clock className="w-5 h-5 text-amber-900" />
                </div>
                <div className="text-2xl sm:text-3xl font-black">
                  {pendingTrxs.length} Transaksi
                </div>
                <div className="text-[11px] text-amber-900 font-bold">
                  Menunggu pembayaran QRIS / Bank VA
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-indigo-100 text-xs font-bold">
                  <span>Tingkat Konversi Pembelian</span>
                  <TrendingUp className="w-5 h-5 text-indigo-200" />
                </div>
                <div className="text-2xl sm:text-3xl font-black">
                  {transactions.length > 0
                    ? Math.round((successTrxs.length / transactions.length) * 100)
                    : 0}
                  %
                </div>
                <div className="text-[11px] text-indigo-100 font-medium">
                  {successTrxs.length} dari {transactions.length} total pesanan
                </div>
              </div>
            </div>

            {/* Coupons Section */}
            <div className="p-4 rounded-2xl border-2 border-amber-300 dark:border-indigo-800 bg-white dark:bg-slate-800 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-600" />
                    <span>Pengatur Kupon Diskon Pemesanan</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Buat kode promo khusus untuk menarik minat orang tua mengunduh versi offline.
                  </p>
                </div>

                <button
                  onClick={() => setShowCouponForm(!showCouponForm)}
                  className="py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showCouponForm ? 'Batal' : 'Buat Kupon Baru'}</span>
                </button>
              </div>

              {/* Create Coupon Form */}
              {showCouponForm && (
                <form
                  onSubmit={handleCreateCoupon}
                  className="p-3 rounded-xl bg-amber-100/50 dark:bg-slate-700/50 border border-amber-300 flex flex-col sm:flex-row items-end gap-3 animate-fade-in text-xs"
                >
                  <div className="flex-1 w-full">
                    <label className="font-bold block mb-1">Kode Kupon</label>
                    <input
                      type="text"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value)}
                      placeholder="Contoh: BUKUANAK20"
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white dark:bg-slate-800 font-bold uppercase"
                      required
                    />
                  </div>

                  <div className="w-full sm:w-36">
                    <label className="font-bold block mb-1">Jenis Diskon</label>
                    <select
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value as 'percent' | 'fixed')}
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white dark:bg-slate-800 font-bold"
                    >
                      <option value="percent">Persentase (%)</option>
                      <option value="fixed">Potongan (Rp)</option>
                    </select>
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="font-bold block mb-1">Nilai Diskon</label>
                    <input
                      type="number"
                      value={newCouponValue}
                      onChange={(e) => setNewCouponValue(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white dark:bg-slate-800 font-bold"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md"
                  >
                    Simpan Kupon
                  </button>
                </form>
              )}

              {/* Coupons List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {coupons.map((c) => (
                  <div
                    key={c.code}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs shadow-sm ${
                      c.isActive
                        ? 'bg-amber-50 dark:bg-slate-700 border-amber-300 dark:border-indigo-700'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="font-black text-sm text-amber-900 dark:text-amber-200">
                        {c.code}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Diskon {c.type === 'percent' ? `${c.value}%` : `Rp ${c.value.toLocaleString('id-ID')}`} • Terpakai {c.usageCount}x
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleCoupon(c.code)}
                        className={`p-1.5 rounded-lg text-[10px] font-bold ${
                          c.isActive ? 'bg-emerald-500/20 text-emerald-700' : 'bg-slate-300 text-slate-700'
                        }`}
                        title="Aktifkan/Nonaktifkan Kupon"
                      >
                        {c.isActive ? 'Aktif' : 'Off'}
                      </button>

                      <button
                        onClick={() => handleDeleteCoupon(c.code)}
                        className="p-1.5 rounded-lg bg-rose-500/20 text-rose-700 hover:bg-rose-500/30 transition-colors"
                        title="Hapus Kupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions Log Table */}
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Riwayat Transaksi Penagihan (Midtrans Log)</span>
              </h3>

              <div className="rounded-2xl border border-amber-200 dark:border-indigo-800 overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-amber-100/60 dark:bg-slate-700/80 text-amber-950 dark:text-amber-100 font-black uppercase text-[10px]">
                      <tr>
                        <th className="p-3">ID Transaksi</th>
                        <th className="p-3">Pembeli</th>
                        <th className="p-3">Buku Cerita</th>
                        <th className="p-3">Metode</th>
                        <th className="p-3">Jumlah (Rp)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Aksi Simu Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 dark:divide-slate-700 font-medium">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-amber-50/50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-amber-900 dark:text-amber-200">{t.id}</td>
                          <td className="p-3">
                            <div className="font-bold">{t.customerName}</div>
                            <div className="text-[10px] text-slate-500">{t.customerEmail}</div>
                          </td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{t.storyTitle}</td>
                          <td className="p-3 uppercase font-bold text-[10px]">{t.paymentMethod}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                            Rp {t.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3">
                            {t.status === 'success' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-black text-[10px]">
                                ✔ SUCCESS
                              </span>
                            )}
                            {t.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black text-[10px]">
                                ⏳ PENDING
                              </span>
                            )}
                            {t.status === 'expired' && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-800 dark:text-rose-300 font-black text-[10px]">
                                ❌ EXPIRED
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {t.status === 'pending' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleUpdateTrxStatus(t.id, 'success')}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                                  title="Tandai Sudah Bayar (Lunas)"
                                >
                                  Bayar
                                </button>
                                <button
                                  onClick={() => handleUpdateTrxStatus(t.id, 'expired')}
                                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px]"
                                  title="Tandai Kedaluwarsa"
                                >
                                  Expired
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GLOBAL SYSTEM & CHILD EYE HEALTH SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
            <div className="p-4 rounded-2xl border-2 border-amber-300 dark:border-indigo-800 bg-white dark:bg-slate-800 flex flex-col gap-4">
              <h3 className="text-base font-black flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Pengaturan Kesehatan Anak & Waktu Aturan "20-20-20"</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
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
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-indigo-700 bg-amber-50/50 dark:bg-slate-900 font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sistem akan secara otomatis memunculkan animasi pengingat istirahat mata setiap {settings.eyeRestIntervalMinutes} menit membaca tanpa henti.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
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
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-indigo-700 bg-amber-50/50 dark:bg-slate-900 font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Link unduhan PDF & EPUB setelah pembelian akan otomatis hangus setelah {settings.downloadLinkExpireHours} jam.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Harga Standar E-Book Unduhan Offline (Rp)
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={settings.defaultEbookPrice}
                    onChange={(e) =>
                      setSettings({ ...settings, defaultEbookPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-indigo-700 bg-amber-50/50 dark:bg-slate-900 font-bold"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Perlindungan Hak Cipta (Social Watermarking)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={settings.enableGlobalWatermark}
                      onChange={(e) =>
                        setSettings({ ...settings, enableGlobalWatermark: e.target.checked })
                      }
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                      Otomatis sematkan stempel Lisensi Resmi dengan Nama & Email pembeli pada file PDF/EPUB
                    </span>
                  </label>
                </div>

                {/* Anti-Right Click & Copy Protection Toggle */}
                <div className="flex flex-col justify-center col-span-1 md:col-span-2 p-3 rounded-xl bg-amber-50 dark:bg-slate-900 border border-amber-300 dark:border-indigo-800">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    🔒 Fitur Anti-Right Click & Copy Protection (Perlindungan Konten E-Book)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={settings.enableCopyProtection ?? true}
                      onChange={(e) =>
                        setSettings({ ...settings, enableCopyProtection: e.target.checked })
                      }
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Aktifkan pencegahan Klik Kanan, Blokir Kombinasi Tombol Ctrl+S / Inspect Element, & Matikan Seleksi Teks saat anak membaca cerita.
                    </span>
                  </label>
                </div>

                {/* Promo Banner Settings */}
                <div className="col-span-1 md:col-span-2 p-4 rounded-xl bg-purple-50 dark:bg-slate-900 border border-purple-200 dark:border-indigo-800 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="font-black text-purple-900 dark:text-purple-200 flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Manajemen Spanduk / Banner Pengumuman Promo Katalog</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={settings.promoBannerActive ?? true}
                        onChange={(e) =>
                          setSettings({ ...settings, promoBannerActive: e.target.checked })
                        }
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="font-bold text-xs text-purple-800 dark:text-purple-300">
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
                    className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-indigo-700 bg-white dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    Spanduk pengumuman promo akan muncul di halaman katalog utama e-book tanpa perlu mengubah kode web.
                  </p>
                </div>

                {/* Cron Job Cleanup Tool */}
                <div className="col-span-1 md:col-span-2 p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-indigo-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin-slow" />
                        <span>Pembersihan Link Kedaluwarsa Otomatis (Cron Job Engine)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
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
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Jalankan Cron Pembersihan Otomatis Sekarang</span>
                    </button>
                  </div>

                  {cronStatus && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                      {cronStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-black text-sm shadow-xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Simpan Semua Pengaturan Sistem Global</span>
            </button>
          </form>
        )}

        {/* TAB 5: ANALISIS RETENSI MEMBACA (DROP-OFF ANALYTICS) */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white shadow-xl flex items-center justify-between flex-wrap gap-4 border border-indigo-500/40">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Evaluasi Bisnis & Daya Tarik Konten</span>
                </span>
                <h3 className="text-xl font-black">Analisis Retensi Membaca (Drop-off Analytics)</h3>
                <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
                  Laporan statistik per-halaman untuk mengetahui di halaman berapa anak-anak berhenti/meninggalkan bacaan, sehingga penulis/desainer dapat merevisi bagian cerita yang kurang menarik.
                </p>
              </div>
            </div>

            {/* Stories Drop-off Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminStore.getDropoffAnalytics(stories).map((analytics) => (
                <div
                  key={analytics.storyId}
                  className="p-5 rounded-2xl border-2 border-amber-200 dark:border-indigo-800 bg-white dark:bg-slate-800 shadow-md flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-amber-100 dark:border-indigo-900 pb-3">
                    <div>
                      <h4 className="font-black text-base text-slate-900 dark:text-white">
                        {analytics.storyTitle}
                      </h4>
                      <div className="text-xs text-slate-500 font-semibold flex flex-wrap items-center gap-2 mt-0.5">
                        <span>Total Pembaca: <strong>{analytics.totalReaders} Anak</strong></span>
                        <span>•</span>
                        <span>Selesai: <strong>{analytics.completedCount} Anak ({analytics.completionRate}%)</strong></span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ${
                        analytics.completionRate >= 70
                          ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                          : analytics.completionRate >= 40
                          ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                          : 'bg-rose-500/20 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {analytics.completionRate >= 70 ? '🌟 Sangat Disukai' : analytics.completionRate >= 40 ? '👍 Cukup Menarik' : '⚠️ Perlu Revisi'}
                    </span>
                  </div>

                  {/* Hotspot Drop-off Alert */}
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 flex items-center gap-3 text-xs">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black">
                      Halaman {analytics.biggestDropPage}
                    </div>
                    <div>
                      <div className="font-black text-amber-950 dark:text-amber-200">
                        Titik Drop-off Terbesar
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Sebagian besar pembaca berhenti di <strong>Halaman {analytics.biggestDropPage}</strong> dari total {analytics.totalPages} halaman. Disarankan merevisi ilustrasi / kalimat di halaman ini.
                      </div>
                    </div>
                  </div>

                  {/* Page-by-Page Reading Funnel */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                      Grafik Corong Retensi Per Halaman:
                    </span>
                    <div className="flex flex-col gap-1 text-[11px] font-bold">
                      {analytics.pageCounts.map((count, idx) => {
                        const pct = Math.round((count / analytics.totalReaders) * 100);
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-16 shrink-0 text-slate-500">Hal {idx + 1}</span>
                            <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-12 text-right shrink-0 text-slate-700 dark:text-slate-300 font-black">
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
        )}

        {/* CMS STORY EDITOR SUB-MODAL */}
        {editingStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div
              className={`w-full max-w-2xl rounded-3xl p-6 shadow-2xl border-4 relative my-auto flex flex-col gap-5 max-h-[90vh] overflow-y-auto ${
                isNight ? 'bg-slate-900 text-slate-100 border-indigo-500' : 'bg-amber-50 text-amber-950 border-amber-300'
              }`}
            >
              <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/50">
                <h3 className="text-lg font-black">
                  {isNewStory ? '✨ Tambah Buku Cerita Baru' : `📝 Edit Buku: "${editingStory.title}"`}
                </h3>
                <button
                  onClick={() => setEditingStory(null)}
                  className="p-2 rounded-full hover:bg-black/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStoryCMS} className="flex flex-col gap-4 text-xs font-semibold">
                <div>
                  <label className="block font-bold mb-1">Judul Buku Cerita</label>
                  <input
                    type="text"
                    value={editingStory.title}
                    onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Kategori / Genrenya</label>
                    <input
                      type="text"
                      value={editingStory.category}
                      onChange={(e) => setEditingStory({ ...editingStory, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white dark:bg-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Usia Target Anak</label>
                    <input
                      type="text"
                      value={editingStory.targetAge}
                      onChange={(e) => setEditingStory({ ...editingStory, targetAge: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white dark:bg-slate-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">URL Gambar Cover</label>
                  <input
                    type="text"
                    value={editingStory.coverImage}
                    onChange={(e) => setEditingStory({ ...editingStory, coverImage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white dark:bg-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Pesan Moral Cerita</label>
                  <textarea
                    rows={2}
                    value={editingStory.moralMessage}
                    onChange={(e) => setEditingStory({ ...editingStory, moralMessage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white dark:bg-slate-800"
                    required
                  />
                </div>

                {/* STATUS AKSES BUKU */}
                <div className="p-3 rounded-2xl bg-amber-100/60 dark:bg-slate-800 border border-amber-300 dark:border-indigo-800 flex flex-col gap-2">
                  <label className="font-black text-xs text-amber-900 dark:text-amber-200">
                    Pengatur Status Akses Pembacaan Online
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="accessStatus"
                        value="free_guest"
                        checked={editingStory.accessStatus === 'free_guest'}
                        onChange={() => setEditingStory({ ...editingStory, accessStatus: 'free_guest' })}
                      />
                      <span>🔓 Gratis Tanpa Login (Dapat dibaca pengunjung baru tanpa akun - Maks 1 Buku)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="accessStatus"
                        value="free_member"
                        checked={editingStory.accessStatus === 'free_member' || !editingStory.accessStatus}
                        onChange={() => setEditingStory({ ...editingStory, accessStatus: 'free_member' })}
                      />
                      <span>🔑 Gratis Setelah Login (Hanya untuk orang tua yang sudah mendaftarkan akun)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="accessStatus"
                        value="paid"
                        checked={editingStory.accessStatus === 'paid'}
                        onChange={() => setEditingStory({ ...editingStory, accessStatus: 'paid' })}
                      />
                      <span>💎 Berbayar (Wajib beli akses e-book)</span>
                    </label>
                  </div>
                </div>

                {/* PENGUNCI FITUR UNDUHAN & HARGA */}
                <div className="p-3 rounded-2xl bg-amber-100/60 dark:bg-slate-800 border border-amber-300 dark:border-indigo-800 flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="font-black text-xs text-amber-900 dark:text-amber-200">
                      Fitur Unduhan Offline (PDF & EPUB)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingStory.downloadEnabled !== false}
                        onChange={(e) => setEditingStory({ ...editingStory, downloadEnabled: e.target.checked })}
                      />
                      <span className="font-bold text-xs">Aktifkan Unduh</span>
                    </label>
                  </div>

                  {editingStory.downloadEnabled !== false && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold">Harga E-Book (Rp)</label>
                        <input
                          type="number"
                          step={1000}
                          value={editingStory.ebookPrice || settings.defaultEbookPrice}
                          onChange={(e) =>
                            setEditingStory({ ...editingStory, ebookPrice: Number(e.target.value) })
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-amber-300 bg-white dark:bg-slate-900 font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingStory.watermarkEnabled !== false}
                            onChange={(e) =>
                              setEditingStory({ ...editingStory, watermarkEnabled: e.target.checked })
                            }
                          />
                          <span className="text-[11px] font-bold">Watermark Otomatis</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- 1. MANAJEMEN HALAMAN BILINGUAL (TEKS GANDA INDONESIA ⇄ INGGRIS) --- */}
                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-800 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-black text-xs uppercase text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Languages className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Input Teks Ganda (Bilingual Page Texts)</span>
                    </span>
                    <span className="text-[10px] bg-indigo-200 text-indigo-900 font-bold px-2 py-0.5 rounded-full">
                      {editingStory.pages.length} Halaman
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                    {editingStory.pages.map((pg, idx) => (
                      <div
                        key={pg.id || idx}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700/60 flex flex-col gap-2"
                      >
                        <span className="font-extrabold text-xs text-indigo-800 dark:text-indigo-300">
                          Halaman {pg.pageNumber}
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-amber-900 dark:text-amber-200">
                              🇮🇩 Teks Bahasa Indonesia
                            </label>
                            <textarea
                              rows={2}
                              value={pg.text}
                              onChange={(e) => {
                                const newPages = [...editingStory.pages];
                                newPages[idx] = { ...newPages[idx], text: e.target.value };
                                setEditingStory({ ...editingStory, pages: newPages });
                              }}
                              className="w-full p-2 text-[11px] rounded-lg border border-amber-300 dark:border-indigo-800 bg-amber-50/50 dark:bg-slate-850"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-indigo-900 dark:text-indigo-200">
                              🇬🇧 English Translation (Edisi Belajar)
                            </label>
                            <textarea
                              rows={2}
                              value={pg.textEn || ''}
                              placeholder="Masukkan teks versi bahasa Inggris..."
                              onChange={(e) => {
                                const newPages = [...editingStory.pages];
                                newPages[idx] = { ...newPages[idx], textEn: e.target.value };
                                setEditingStory({ ...editingStory, pages: newPages });
                              }}
                              className="w-full p-2 text-[11px] rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-slate-850"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* --- 2. MANAJEMEN GLOSARIUM KAMUS SENTUH --- */}
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-slate-800 border-2 border-purple-200 dark:border-purple-800 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-black text-xs uppercase text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Manajemen Glosarium (Kamus Sentuh Tap-to-Translate)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentGlossary = editingStory.glossary || [];
                        const newItem = {
                          id: `g_${Date.now()}`,
                          wordEn: 'Friend',
                          translationId: 'Sahabat',
                          phonetic: 'frend',
                          emoji: '🤝',
                        };
                        setEditingStory({
                          ...editingStory,
                          glossary: [...currentGlossary, newItem],
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px]"
                    >
                      + Tambah Kata
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {(editingStory.glossary || []).map((item, gIdx) => (
                      <div
                        key={item.id || gIdx}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700/60 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-[11px]"
                      >
                        <input
                          type="text"
                          placeholder="Kata EN (Mis: Rabbit)"
                          value={item.wordEn}
                          onChange={(e) => {
                            const updated = [...(editingStory.glossary || [])];
                            updated[gIdx] = { ...updated[gIdx], wordEn: e.target.value };
                            setEditingStory({ ...editingStory, glossary: updated });
                          }}
                          className="px-2 py-1 rounded border border-purple-300 font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Arti ID (Mis: Kelinci)"
                          value={item.translationId}
                          onChange={(e) => {
                            const updated = [...(editingStory.glossary || [])];
                            updated[gIdx] = { ...updated[gIdx], translationId: e.target.value };
                            setEditingStory({ ...editingStory, glossary: updated });
                          }}
                          className="px-2 py-1 rounded border border-purple-300"
                        />
                        <input
                          type="text"
                          placeholder="Fonetik (Mis: rab-it)"
                          value={item.phonetic || ''}
                          onChange={(e) => {
                            const updated = [...(editingStory.glossary || [])];
                            updated[gIdx] = { ...updated[gIdx], phonetic: e.target.value };
                            setEditingStory({ ...editingStory, glossary: updated });
                          }}
                          className="px-2 py-1 rounded border border-purple-300"
                        />
                        <input
                          type="text"
                          placeholder="Emoji (Mis: 🐰)"
                          value={item.emoji || ''}
                          onChange={(e) => {
                            const updated = [...(editingStory.glossary || [])];
                            updated[gIdx] = { ...updated[gIdx], emoji: e.target.value };
                            setEditingStory({ ...editingStory, glossary: updated });
                          }}
                          className="px-2 py-1 rounded border border-purple-300 text-center"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (editingStory.glossary || []).filter((_, i) => i !== gIdx);
                            setEditingStory({ ...editingStory, glossary: updated });
                          }}
                          className="px-2 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px]"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* --- 3. PUSTAKA SUARA (AUDIO LIBRARY NATIVE NARRATION) --- */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-800 flex flex-col gap-2">
                  <span className="font-black text-xs uppercase text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Megaphone className="w-4 h-4 text-amber-600" />
                    <span>Pustaka Suara Narator Asli (Audio Library)</span>
                  </span>
                  <p className="text-[11px] text-amber-800/80 dark:text-indigo-200">
                    Sistem audio otomatis dikelola secara dynamic via Speech Synthesis native browser dan rekam suara kustom per halaman oleh orang tua/narator.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 text-white font-black text-xs shadow-lg transition-transform hover:scale-[1.02] mt-2"
                >
                  Simpan Perubahan Buku
                </button>
              </form>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

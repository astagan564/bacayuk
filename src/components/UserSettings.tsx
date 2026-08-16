import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  Database,
  Download,
  ExternalLink,
  Laptop,
  LoaderCircle,
  LogOut,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { userSettingsStore, UserSettings } from '../utils/userSettingsStore';
import { userAuthStore, type UserAccount } from '../utils/userAuthStore';
import { deleteAccount, fetchAccountDataExport } from '@/features/account/api/accountPrivacyApi';
import { clearLocalAccountData, getLocalAccountData } from '@/features/account/utils/accountLocalData';
import { WhatsAppContactsPanel } from '@/features/account';
import { fetchPaymentOrders } from '@/features/commerce/api/manualPaymentApi';
import {
  ManualPaymentModal,
  UserPaymentOrdersPanel,
  type ManualPaymentOrder,
} from '@/features/commerce';

interface UserSettingsProps {
  onBack: () => void;
  isNight?: boolean;
}

export const UserSettingsView: React.FC<UserSettingsProps> = ({ onBack, isNight = false }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => userAuthStore.getUser());
  const [accountAction, setAccountAction] = useState<'export' | 'logout' | 'clear' | 'delete' | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleteEmail, setDeleteEmail] = useState('');
  const [paymentOrders, setPaymentOrders] = useState<ManualPaymentOrder[]>([]);
  const [paymentOrdersError, setPaymentOrdersError] = useState<string | null>(null);
  const [isLoadingPaymentOrders, setIsLoadingPaymentOrders] = useState(false);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<ManualPaymentOrder | null>(null);
  const paymentOrdersAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSettings(userSettingsStore.getSettings());
    let active = true;
    const subscription = userAuthStore.onAuthStateChange((user) => {
      if (active) setCurrentUser(user);
    });
    void userAuthStore.initialize().then((user) => {
      if (active) setCurrentUser(user);
    }).catch(() => {
      if (active) setCurrentUser(null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadPaymentOrders = useCallback(async () => {
    paymentOrdersAbortRef.current?.abort();
    if (!currentUser) {
      setPaymentOrders([]);
      setPaymentOrdersError(null);
      setIsLoadingPaymentOrders(false);
      setSelectedPaymentOrder(null);
      return;
    }
    const requestedUserId = currentUser.id;
    const abortController = new AbortController();
    paymentOrdersAbortRef.current = abortController;
    setIsLoadingPaymentOrders(true);
    setPaymentOrdersError(null);
    try {
      const orders = await fetchPaymentOrders(abortController.signal);
      if (!abortController.signal.aborted && userAuthStore.getUser()?.id === requestedUserId) {
        setPaymentOrders(orders);
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        setPaymentOrdersError(error instanceof Error ? error.message : 'Riwayat pembayaran belum dapat dimuat.');
      }
    } finally {
      if (paymentOrdersAbortRef.current === abortController) {
        paymentOrdersAbortRef.current = null;
        setIsLoadingPaymentOrders(false);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    void loadPaymentOrders();
    return () => paymentOrdersAbortRef.current?.abort();
  }, [loadPaymentOrders]);

  const showToast = (message: string) => {
    setToastMsg(message);
    window.setTimeout(() => setToastMsg(''), 3500);
  };

  const handleExportData = async () => {
    if (!currentUser) return;
    setAccountAction('export');
    try {
      const [serverData, localDeviceData] = await Promise.all([
        fetchAccountDataExport(),
        getLocalAccountData(currentUser.id),
      ]);
      const blob = new Blob([
        JSON.stringify({ ...serverData, localDeviceData }, null, 2),
      ], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `bacayuk-data-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      showToast('Salinan data berhasil diunduh.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Data gagal diunduh.');
    } finally {
      setAccountAction(null);
    }
  };

  const handleClearDeviceData = async () => {
    if (!currentUser || !window.confirm('Hapus progres, favorit, preferensi, cache pembelian, dan rekaman suara dari perangkat ini? Akun serta transaksi server tidak ikut dihapus.')) return;
    setAccountAction('clear');
    await clearLocalAccountData(currentUser.id);
    setSettings(userSettingsStore.getSettings());
    setAccountAction(null);
    showToast('Data lokal perangkat sudah dibersihkan.');
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Keluar dari BacaYuk di semua perangkat yang menggunakan akun ini?')) return;
    setAccountAction('logout');
    try {
      await userAuthStore.logoutAllDevices();
      setCurrentUser(null);
      showToast('Semua sesi akun sudah dikeluarkan.');
    } catch {
      showToast('Gagal mengeluarkan semua sesi. Coba lagi.');
    } finally {
      setAccountAction(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setAccountAction('delete');
    try {
      await deleteAccount(deleteEmail, deletePhrase);
      await clearLocalAccountData(currentUser.id);
      await userAuthStore.finishAccountDeletion();
      window.location.assign('/');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Akun gagal dihapus.');
      setAccountAction(null);
    }
  };

  if (!settings) return null;

  const handleSave = () => {
    if (settings.securityQuestionType === 'custom' && (!settings.customQuestion.trim() || !settings.customAnswer.trim())) {
      setToastMsg('Harap lengkapi pertanyaan dan jawaban kustom Anda!');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }

    setIsSaving(true);
    userSettingsStore.saveSettings(settings);
    setToastMsg('Pengaturan berhasil disimpan!');
    
    setTimeout(() => {
      setIsSaving(false);
      setToastMsg('');
    }, 2000);
  };

  return (
    <>
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl transition-colors bg-surface hover:bg-black/10 dark:hover:bg-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Pengaturan Orang Tua
            </h1>
            <p className="text-sm opacity-70">Kelola akun, privasi, dan preferensi membaca keluarga</p>
          </div>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border-2 border-default bg-surface shadow-sm">
            <div className="border-b border-default bg-[linear-gradient(135deg,color-mix(in_srgb,var(--story-green)_14%,transparent),transparent)] p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-green text-white">
                  <UserRound className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-green">Akun orang tua</p>
                  {currentUser ? (
                    <>
                      <h2 className="mt-1 truncate text-xl font-black">{currentUser.name}</h2>
                      <p className="truncate text-sm opacity-70">{currentUser.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
                        <span className="rounded-full border border-default bg-card px-3 py-1 capitalize">Login {currentUser.loginMethod}</span>
                        <span className="rounded-full border border-brand-green/30 bg-brand-green/10 px-3 py-1 text-brand-green">
                          {userAuthStore.isVip() ? `VIP hingga ${new Date(currentUser.vipExpiresAt!).toLocaleDateString('id-ID')}` : 'Member gratis'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="mt-1 text-xl font-black">Belum masuk</h2>
                      <p className="mt-1 text-sm opacity-70">Masuk dari beranda untuk mengelola salinan data, sesi, dan penghapusan akun.</p>
                      <a href="/" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white">
                        Ke beranda <ExternalLink className="h-4 w-4" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {currentUser && (
              <div className="grid gap-px bg-[var(--border-default)] sm:grid-cols-2">
                <button onClick={handleExportData} disabled={accountAction !== null} className="flex items-start gap-3 bg-card p-5 text-left transition-colors hover:bg-surface-hover disabled:opacity-50">
                  {accountAction === 'export' ? <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-brand-green" /> : <Download className="h-5 w-5 shrink-0 text-brand-green" />}
                  <span><strong className="block text-sm">Unduh data saya</strong><span className="mt-1 block text-xs leading-5 opacity-65">Salinan JSON profil, aktivitas membaca, pembelian, hak akses, dan data lokal.</span></span>
                </button>
                <button onClick={handleLogoutAllDevices} disabled={accountAction !== null} className="flex items-start gap-3 bg-card p-5 text-left transition-colors hover:bg-surface-hover disabled:opacity-50">
                  {accountAction === 'logout' ? <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-brand-green" /> : <LogOut className="h-5 w-5 shrink-0 text-brand-green" />}
                  <span><strong className="block text-sm">Keluar dari semua perangkat</strong><span className="mt-1 block text-xs leading-5 opacity-65">Cabut sesi login aktif, termasuk perangkat lain milik keluarga.</span></span>
                </button>
              </div>
            )}
          </section>

          {currentUser && (
            <UserPaymentOrdersPanel
              orders={paymentOrders}
              error={paymentOrdersError}
              isLoading={isLoadingPaymentOrders}
              onRefresh={() => void loadPaymentOrders()}
              onResume={setSelectedPaymentOrder}
            />
          )}

          {currentUser && <WhatsAppContactsPanel />}

          {currentUser && (
            <section className="rounded-3xl border-2 border-default bg-surface p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Laptop className="h-5 w-5" /> Data di perangkat ini</h2>
              <p className="mt-2 text-sm leading-6 opacity-75">Favorit, progres, preferensi, dan rekaman suara disimpan di browser. Rekaman suara tidak diunggah ke server.</p>
              <button onClick={handleClearDeviceData} disabled={accountAction !== null} className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-default bg-card px-4 py-2.5 text-sm font-bold transition-colors hover:bg-surface-hover disabled:opacity-50">
                {accountAction === 'clear' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                Bersihkan data perangkat
              </button>
            </section>
          )}

          {/* Notifications */}
          <div className="p-6 rounded-3xl border-2 bg-surface border-default shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5" />
              Notifikasi & Peringatan
            </h2>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-bold">Aktifkan Notifikasi</span>
                <p className="text-xs opacity-70">Tampilkan pesan pop-up untuk pencapaian membaca dan pengingat istirahat.</p>
              </div>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.enableNotifications}
                  onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                />
                <div className="w-11 h-6 bg-[var(--border-default)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border-default)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
              </div>
            </label>
          </div>

          {/* Reading Interval */}
          <div className="p-6 rounded-3xl border-2 bg-surface border-default shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" />
              Durasi Membaca Maksimal
            </h2>
            <div className="space-y-4">
              <p className="text-sm opacity-80">
                Atur berapa lama anak boleh membaca berturut-turut sebelum pop-up pengingat istirahat mata muncul. 
                Kosongkan untuk mengikuti aturan <strong className="text-primary">default</strong> dari Admin.
              </p>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1 block">Menit</label>
                <input 
                  type="number"
                  min="1"
                  max="120"
                  placeholder="Gunakan default admin"
                  value={settings.restIntervalMinutes || ''}
                  onChange={(e) => setSettings({ ...settings, restIntervalMinutes: e.target.value ? parseInt(e.target.value, 10) : null })}
                  className="w-full p-3 rounded-xl border-2 bg-card border-default focus:border-brand-green focus:outline-none font-bold text-primary"
                />
              </div>
            </div>
          </div>

          {/* Security Question */}
          <div className="p-6 rounded-3xl border-2 bg-surface border-default shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5" />
              Pertanyaan Pengaman (Parental Gate)
            </h2>
            <div className="space-y-4">
              <p className="text-sm opacity-80">
                Pilih jenis pertanyaan yang harus dijawab saat anak mencoba melewati layar istirahat atau area khusus orang tua.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSettings({ ...settings, securityQuestionType: 'math' })}
                  className={`flex-1 p-3 rounded-xl border-2 font-bold transition-colors ${settings.securityQuestionType === 'math' ? 'border-default bg-default text-primary' : 'border-default opacity-60 text-primary'}`}
                >
                  Matematika Sederhana
                </button>
                <button
                  onClick={() => setSettings({ ...settings, securityQuestionType: 'custom' })}
                  className={`flex-1 p-3 rounded-xl border-2 font-bold transition-colors ${settings.securityQuestionType === 'custom' ? 'border-default bg-default text-primary' : 'border-default opacity-60 text-primary'}`}
                >
                  Pertanyaan Kustom
                </button>
              </div>

              {settings.securityQuestionType === 'custom' && (
                <div className="p-4 rounded-xl space-y-4 bg-surface">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1 block">Pertanyaan (Teks)</label>
                    <input 
                      type="text"
                      placeholder="Contoh: Siapa nama kucing peliharaan kita?"
                      value={settings.customQuestion}
                      onChange={(e) => setSettings({ ...settings, customQuestion: e.target.value })}
                      className="w-full p-3 rounded-xl border-2 bg-card border-default focus:border-brand-green focus:outline-none text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1 block">Jawaban (Satu Kata)</label>
                    <input 
                      type="text"
                      placeholder="Contoh: Moli"
                      value={settings.customAnswer}
                      onChange={(e) => setSettings({ ...settings, customAnswer: e.target.value })}
                      className="w-full p-3 rounded-xl border-2 bg-card border-default focus:border-brand-green focus:outline-none text-primary"
                    />
                    <p className="text-[10px] opacity-60 mt-1">Jawaban akan divalidasi tanpa memedulikan huruf besar/kecil (case-insensitive).</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary px-6 py-3 flex items-center gap-2 disabled:opacity-50 text-sm sm:text-base"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>

          {currentUser && (
            <section className="rounded-3xl border-2 border-brand-rose/35 bg-brand-rose/5 p-6">
              <div className="flex items-start gap-3">
                <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-rose" />
                <div>
                  <h2 className="text-lg font-black">Hapus akun permanen</h2>
                  <p className="mt-2 text-sm leading-6 opacity-75">Profil, aktivitas membaca, dan hak unduh akan dihapus. Catatan transaksi yang perlu dipertahankan untuk administrasi akan dianonimkan. Tindakan ini tidak dapat dibatalkan.</p>
                  <a href="/legal#hapus-data" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-green hover:underline">Baca kebijakan penghapusan data <ExternalLink className="h-3.5 w-3.5" /></a>
                </div>
              </div>

              {!showDeleteConfirmation ? (
                <button onClick={() => setShowDeleteConfirmation(true)} className="mt-5 rounded-xl border-2 border-brand-rose/45 bg-card px-4 py-2.5 text-sm font-bold text-brand-rose">
                  Mulai hapus akun
                </button>
              ) : (
                <div className="mt-5 space-y-4 rounded-2xl border border-brand-rose/30 bg-card p-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold">Ketik email akun</label>
                    <input type="email" autoComplete="email" value={deleteEmail} onChange={(event) => setDeleteEmail(event.target.value)} placeholder={currentUser.email} className="w-full rounded-xl border-2 border-default bg-surface p-3 text-sm text-primary focus:border-brand-rose focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold">Ketik <span className="text-brand-rose">HAPUS AKUN</span></label>
                    <input type="text" value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value)} className="w-full rounded-xl border-2 border-default bg-surface p-3 text-sm text-primary focus:border-brand-rose focus:outline-none" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleDeleteAccount} disabled={accountAction !== null || deletePhrase !== 'HAPUS AKUN' || deleteEmail.trim().toLowerCase() !== currentUser.email.toLowerCase()} className="inline-flex items-center gap-2 rounded-xl bg-brand-rose px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
                      {accountAction === 'delete' && <LoaderCircle className="h-4 w-4 animate-spin" />}
                      Hapus akun saya
                    </button>
                    <button onClick={() => { setShowDeleteConfirmation(false); setDeletePhrase(''); setDeleteEmail(''); }} disabled={accountAction !== null} className="rounded-xl border-2 border-default px-4 py-2.5 text-sm font-bold">Batal</button>
                  </div>
                </div>
              )}
            </section>
          )}

          {toastMsg && (
            <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-brand-green text-white font-bold shadow-xl animate-bounce-subtle flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {toastMsg}
            </div>
          )}
        </div>
      </div>
    </div>
    {selectedPaymentOrder && (
      <ManualPaymentModal
        initialOrder={selectedPaymentOrder}
        isVipOnly={selectedPaymentOrder.purchaseType === 'vip'}
        onClose={() => {
          setSelectedPaymentOrder(null);
          void loadPaymentOrders();
        }}
        onOrderSubmitted={() => {
          setSelectedPaymentOrder(null);
          void loadPaymentOrders();
        }}
      />
    )}
    </>
  );
};

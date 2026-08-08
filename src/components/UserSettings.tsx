import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, Clock, ShieldCheck, Bell, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { userSettingsStore, UserSettings } from '../utils/userSettingsStore';

interface UserSettingsProps {
  onBack: () => void;
  isNight?: boolean;
}

export const UserSettingsView: React.FC<UserSettingsProps> = ({ onBack, isNight = false }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    setSettings(userSettingsStore.getSettings());
  }, []);

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
    <div className={`min-h-screen pt-24 pb-12 px-4 sm:px-6 ${isNight ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={`p-2 rounded-xl transition-colors ${isNight ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-500" />
              Pengaturan Orang Tua
            </h1>
            <p className="text-sm opacity-70">Kelola preferensi membaca anak dan keamanan aplikasi</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <div className={`p-6 rounded-3xl border-2 ${isNight ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-amber-500" />
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
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </div>
            </label>
          </div>

          {/* Reading Interval */}
          <div className={`p-6 rounded-3xl border-2 ${isNight ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-emerald-500" />
              Durasi Membaca Maksimal
            </h2>
            <div className="space-y-4">
              <p className="text-sm opacity-80">
                Atur berapa lama anak boleh membaca berturut-turut sebelum pop-up pengingat istirahat mata (Aturan 20-20-20) muncul. 
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
                  className={`w-full p-3 rounded-xl border-2 ${isNight ? 'bg-slate-950 border-slate-800 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'} focus:outline-none font-bold`}
                />
              </div>
            </div>
          </div>

          {/* Security Question */}
          <div className={`p-6 rounded-3xl border-2 ${isNight ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-rose-500" />
              Pertanyaan Pengaman (Parental Gate)
            </h2>
            <div className="space-y-4">
              <p className="text-sm opacity-80">
                Pilih jenis pertanyaan yang harus dijawab saat anak mencoba melewati layar istirahat atau area khusus orang tua.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSettings({ ...settings, securityQuestionType: 'math' })}
                  className={`flex-1 p-3 rounded-xl border-2 font-bold transition-colors ${settings.securityQuestionType === 'math' ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400' : 'border-slate-200 dark:border-slate-800 opacity-60'}`}
                >
                  Matematika Sederhana
                </button>
                <button
                  onClick={() => setSettings({ ...settings, securityQuestionType: 'custom' })}
                  className={`flex-1 p-3 rounded-xl border-2 font-bold transition-colors ${settings.securityQuestionType === 'custom' ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400' : 'border-slate-200 dark:border-slate-800 opacity-60'}`}
                >
                  Pertanyaan Kustom
                </button>
              </div>

              {settings.securityQuestionType === 'custom' && (
                <div className={`p-4 rounded-xl space-y-4 ${isNight ? 'bg-slate-950/50' : 'bg-slate-100'}`}>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1 block">Pertanyaan (Teks)</label>
                    <input 
                      type="text"
                      placeholder="Contoh: Siapa nama kucing peliharaan kita?"
                      value={settings.customQuestion}
                      onChange={(e) => setSettings({ ...settings, customQuestion: e.target.value })}
                      className={`w-full p-3 rounded-xl border-2 ${isNight ? 'bg-slate-900 border-slate-800 focus:border-rose-500' : 'bg-white border-slate-200 focus:border-rose-500'} focus:outline-none`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1 block">Jawaban (Satu Kata)</label>
                    <input 
                      type="text"
                      placeholder="Contoh: Moli"
                      value={settings.customAnswer}
                      onChange={(e) => setSettings({ ...settings, customAnswer: e.target.value })}
                      className={`w-full p-3 rounded-xl border-2 ${isNight ? 'bg-slate-900 border-slate-800 focus:border-rose-500' : 'bg-white border-slate-200 focus:border-rose-500'} focus:outline-none`}
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
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black flex items-center gap-2 shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>

          {toastMsg && (
            <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-xl animate-bounce-subtle flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {toastMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

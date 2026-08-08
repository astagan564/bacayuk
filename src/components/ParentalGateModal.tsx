import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, X, HelpCircle } from 'lucide-react';
import { userSettingsStore, UserSettings } from '../utils/userSettingsStore';

interface ParentalGateModalProps {
  onSuccess: () => void;
  onCancel: () => void;
  isNight?: boolean;
}

export const ParentalGateModal: React.FC<ParentalGateModalProps> = ({
  onSuccess,
  onCancel,
  isNight = false,
}) => {
  const [num1, setNum1] = useState(12);
  const [num2, setNum2] = useState(7);
  const [userAnswer, setUserAnswer] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    // Generate random math challenge
    const n1 = Math.floor(Math.random() * 15) + 10;
    const n2 = Math.floor(Math.random() * 9) + 5;
    setNum1(n1);
    setNum2(n2);
    
    // Load settings
    setSettings(userSettingsStore.getSettings());
  }, []);

  const correctAnswer = num1 + num2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    if (settings.securityQuestionType === 'custom') {
      const expected = settings.customAnswer.trim().toLowerCase();
      const actual = userAnswer.trim().toLowerCase();
      if (actual === expected) {
        onSuccess();
      } else {
        setErrorMsg('Jawaban belum tepat! Verifikasi ini khusus untuk Orang Tua/Wali.');
        setUserAnswer('');
      }
    } else {
      if (parseInt(userAnswer.trim(), 10) === correctAnswer) {
        onSuccess();
      } else {
        setErrorMsg('Jawaban belum tepat! Verifikasi ini khusus untuk Orang Tua/Wali.');
        setUserAnswer('');
      }
    }
  };

  const handleForgotAnswer = () => {
    // Simulate sending email/whatsapp
    alert('Jawaban kustom Anda telah dikirimkan ke Email / WhatsApp yang terdaftar pada akun Anda.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border-4 relative flex flex-col gap-5 ${
          isNight ? 'bg-slate-900 text-slate-100 border-indigo-500' : 'bg-amber-50 text-amber-950 border-amber-300'
        }`}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors"
          title="Batal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500 text-amber-950 font-black shadow-lg">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Gerbang Keamanan Orang Tua (Parental Gate)</span>
            </span>
            <h3 className="text-xl font-black">Area Khusus Orang Tua</h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
          Untuk melindungi anak-anak dari transaksi tidak disengaja, mohon selesaikan pertanyaan matematika sederhana berikut sebelum masuk ke menu pembelian:
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-amber-300 dark:border-indigo-800 text-center flex flex-col items-center gap-2 shadow-inner">
            <div className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1">
              <HelpCircle className="w-4 h-4" />
              <span>{settings?.securityQuestionType === 'custom' ? 'Jawab pertanyaan berikut:' : 'Berapa hasil penjumlahan berikut?'}</span>
            </div>

            <div className="text-xl sm:text-2xl font-black tracking-wide text-slate-900 dark:text-white py-2 text-center px-2 leading-snug">
              {settings?.securityQuestionType === 'custom' ? settings.customQuestion : `${num1} + ${num2} = ?`}
            </div>

            <input
              type={settings?.securityQuestionType === 'custom' ? "text" : "number"}
              value={userAnswer}
              onChange={(e) => {
                setUserAnswer(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Ketik jawaban di sini..."
              className="w-full max-w-[250px] text-center px-4 py-2.5 rounded-xl border-2 border-amber-400 dark:border-indigo-600 bg-amber-50/50 dark:bg-slate-900 font-black text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
              required
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-xs font-black hover:bg-black/5"
            >
              Kembali
            </button>
            <button
              type="submit"
              className="flex-[1.5] py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 font-black text-xs shadow-md transition-transform hover:scale-[1.02] flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesai & Lanjutkan</span>
            </button>
          </div>
          
          {settings?.securityQuestionType === 'custom' && (
            <div className="text-center mt-1">
              <button
                type="button"
                onClick={handleForgotAnswer}
                className="text-[10px] text-amber-700 dark:text-amber-400 font-bold hover:underline"
              >
                Lupa jawaban? Kirim ke Email/WhatsApp
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

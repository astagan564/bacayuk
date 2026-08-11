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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-sm animate-fade-in">
      <div
        className="app-modal w-full max-w-md rounded-[1.35rem] p-6 sm:p-8 relative flex flex-col gap-5"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors"
          title="Batal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[var(--story-green)] text-white font-black shadow-lg">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--story-green)]" />
              <span>Gerbang Keamanan Orang Tua (Parental Gate)</span>
            </span>
            <h3 className="text-xl font-black">Area Khusus Orang Tua</h3>
          </div>
        </div>

        <p className="text-xs text-secondary font-semibold leading-relaxed">
          Untuk melindungi anak-anak dari transaksi tidak disengaja, mohon selesaikan pertanyaan matematika sederhana berikut sebelum masuk ke menu pembelian:
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="reader-soft-panel p-4 rounded-2xl text-center flex flex-col items-center gap-2">
            <div className="text-xs font-black text-secondary uppercase tracking-wide flex items-center gap-1">
              <HelpCircle className="w-4 h-4" />
              <span>{settings?.securityQuestionType === 'custom' ? 'Jawab pertanyaan berikut:' : 'Berapa hasil penjumlahan berikut?'}</span>
            </div>

            <div className="text-xl sm:text-2xl font-black tracking-wide text-primary py-2 text-center px-2 leading-snug">
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
              className="reader-field w-full max-w-[250px] text-center px-4 py-2.5 rounded-xl font-black text-lg focus:outline-none focus:ring-2 focus:ring-[var(--magic-blue)]"
              autoFocus
              required
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-error/20 border border-error/40 text-error text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1 py-3 px-4 text-xs"
            >
              Kembali
            </button>
            <button
              type="submit"
              className="btn-primary flex-[1.5] py-3 px-4 text-xs flex items-center justify-center gap-1.5"
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
                className="text-[10px] text-warning font-bold hover:underline"
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

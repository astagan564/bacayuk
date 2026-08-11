import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';

interface AdminPinDialogProps {
  isVerifying: boolean;
  onCancel: () => void;
  onVerify: (pin: string) => void | Promise<void>;
}

export function AdminPinDialog({
  isVerifying,
  onCancel,
  onVerify,
}: AdminPinDialogProps) {
  const [pin, setPin] = useState('');

  const handleSubmit = useCallback((event: FormEvent) => {
    event.preventDefault();
    if (pin.trim()) void onVerify(pin);
  }, [onVerify, pin]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl overflow-hidden z-50 flex flex-col gap-4 app-modal"
      >
        <h3 className="text-lg font-extrabold font-sans mb-0 text-center flex items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-blue" />
          Otentikasi Admin
        </h3>
        <p className="text-xs text-center opacity-80">Area Admin</p>
        <input
          type="password"
          autoFocus
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          disabled={isVerifying}
          className="w-full px-4 py-3 rounded-xl border-default text-center font-extrabold tracking-[0.5em] text-lg focus:outline-none reader-field disabled:opacity-60"
          placeholder="••••"
          aria-label="PIN Admin"
        />
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            disabled={isVerifying || !pin.trim()}
            className="btn-primary flex-1 py-3 text-xs disabled:opacity-60"
          >
            {isVerifying ? 'Memverifikasi…' : 'Masuk'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isVerifying}
            className="flex-1 py-3 rounded-xl font-bold text-xs btn-secondary disabled:opacity-60"
          >
            Batal
          </button>
        </div>
        <p className="text-[10px] text-center opacity-50 mt-1">Masukkan PIN Anda</p>
      </form>
    </div>
  );
}

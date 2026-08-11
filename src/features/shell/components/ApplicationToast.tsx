interface ApplicationToastProps {
  message: string | null;
}

export function ApplicationToast({ message }: ApplicationToastProps) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 app-modal px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 font-semibold text-xs sm:text-sm animate-fade-in"
    >
      <span>{message}</span>
    </div>
  );
}

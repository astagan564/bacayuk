import packageJson from '../../../../package.json';
import { Link } from '@tanstack/react-router';

interface ApplicationFooterProps {
  onOpenChangelog: () => void;
}

export function ApplicationFooter({ onOpenChangelog }: ApplicationFooterProps) {
  return (
    <footer className="w-full text-xs py-3 px-4 text-center border-t z-30 transition-colors duration-500 flex flex-col items-center gap-1 bg-surface border-default text-secondary">
      <p>BacaYuk • Aplikasi Buku Cerita Anak Interaktif untuk Membaca Bersama Keluarga</p>
      <div className="flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity text-[10px]">
        <span>v{packageJson.version}</span>
        <span>•</span>
        <button
          type="button"
          onClick={onOpenChangelog}
          className="underline hover:text-action-secondary transition-colors"
        >
          Changelog
        </button>
        <span>•</span>
        <Link to="/legal" className="underline hover:text-action-secondary transition-colors">
          Privasi & Ketentuan
        </Link>
      </div>
    </footer>
  );
}

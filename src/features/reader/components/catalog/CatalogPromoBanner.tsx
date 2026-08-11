import { Megaphone } from 'lucide-react';
import type { AdminSettings } from '@/utils/adminStore';

interface CatalogPromoBannerProps {
  settings: AdminSettings;
}

export function CatalogPromoBanner({ settings }: CatalogPromoBannerProps) {
  if (!settings.promoBannerActive || !settings.promoBannerText) return null;

  return (
    <div className="book-panel rounded-2xl px-4 py-3 flex items-start sm:items-center justify-between gap-3 animate-fade-in text-primary">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-2 rounded-lg bg-default/40">
          <Megaphone className="w-4 h-4" />
        </div>
        <p className="text-xs sm:text-sm font-semibold leading-relaxed text-pretty">
          {settings.promoBannerText}
        </p>
      </div>
      <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md border border-default text-[11px] font-bold text-secondary">
        Berlaku Sekarang
      </span>
    </div>
  );
}

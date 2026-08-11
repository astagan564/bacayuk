import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  CreditCard,
  ReceiptText,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import bacaYukLogo from '@/assets/bacayuk-logo.svg';
import bacaYukMark from '@/assets/bacayuk-mark.svg';
import type { AdminSection } from '@/features/admin/types';

interface AdminSidebarProps {
  activeSection: AdminSection;
  userCount: number;
  onSectionChange: (section: AdminSection) => void;
  onBackToHome: () => void;
}

interface AdminNavigationItem {
  id: AdminSection;
  icon: LucideIcon;
  label: string;
}

function AdminSidebarComponent({
  activeSection,
  userCount,
  onSectionChange,
  onBackToHome,
}: AdminSidebarProps) {
  const navigationItems: AdminNavigationItem[] = [
    { id: 'cms', icon: BookOpen, label: 'Kelola buku' },
    { id: 'users', icon: Users, label: `Pengguna (${userCount})` },
    { id: 'finance', icon: CreditCard, label: 'Pembayaran' },
    { id: 'costs', icon: ReceiptText, label: 'Biaya & margin' },
    { id: 'settings', icon: Settings, label: 'Pengaturan' },
    { id: 'analytics', icon: TrendingUp, label: 'Retensi baca' },
  ];

  return (
    <aside className="w-20 sm:w-72 shrink-0 border-r border-default flex flex-col h-screen bg-surface">
      <div className="p-4 sm:p-6 border-b border-transparent">
        <div className="flex flex-col gap-2 items-center sm:items-start">
          <img src={bacaYukMark} alt="BacaYuk" className="h-11 w-11 sm:hidden" />
          <img src={bacaYukLogo} alt="BacaYuk" className="hidden h-12 w-auto max-w-full sm:block" />
          <div className="inline-flex items-center gap-2 text-[10px] font-bold text-secondary">
            <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0" />
            <span className="hidden sm:inline">Ruang pengelola</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 sm:p-4 flex flex-col gap-2 overflow-y-auto">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`w-full py-3 px-3 sm:px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center sm:justify-start gap-3 ${
              activeSection === item.id
                ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-sm'
                : 'text-secondary hover:bg-surface-hover'
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
          className="w-full py-3 px-3 sm:px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center sm:justify-start gap-2 bg-surface/70 hover:bg-card text-secondary hover:text-primary border border-default"
          title="Tutup & Kembali"
        >
          <X className="w-5 h-5 shrink-0" />
          <span className="hidden sm:inline">Tutup & Kembali</span>
        </button>
      </div>
    </aside>
  );
}

export const AdminSidebar = memo(AdminSidebarComponent);

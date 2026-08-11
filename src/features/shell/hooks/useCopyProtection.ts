import { useEffect } from 'react';
import { adminStore } from '@/utils/adminStore';

function isProtectedShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  return (event.ctrlKey && ['s', 'u', 'p'].includes(key))
    || event.key === 'F12'
    || (event.ctrlKey && event.shiftKey && ['i', 'c'].includes(key));
}

export function useCopyProtection(showToast: (message: string) => void): void {
  useEffect(() => {
    if (!adminStore.getSettings().enableCopyProtection) return;

    const handleContextMenu = (event: MouseEvent): void => {
      event.preventDefault();
      showToast('🔒 Hak Cipta Dilindungi: Klik kanan dinonaktifkan.');
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!isProtectedShortcut(event)) return;
      event.preventDefault();
      showToast('🔒 Tombol shortcut dinonaktifkan untuk melindungi e-book.');
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showToast]);
}

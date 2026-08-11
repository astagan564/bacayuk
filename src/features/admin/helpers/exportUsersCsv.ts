import type { UserAccount } from '@/utils/userAuthStore';

function escapeCsvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function exportUsersCsv(users: UserAccount[]): void {
  const headers = ['ID', 'Nama', 'Email', 'No_WhatsApp', 'Metode_Login', 'Tanggal_Daftar'];
  const rows = users.map((user) => [
    user.id,
    user.name,
    user.email,
    user.phone || '-',
    user.loginMethod,
    user.createdAt,
  ].map(escapeCsvCell).join(','));
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Database_OrangTua_BukuCerita_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

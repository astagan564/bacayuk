import type { UserReadingActivity } from '@/utils/adminStore';
import type { UserAccount } from '@/utils/userAuthStore';
import { AlertCircle, BookOpen, FileSpreadsheet, RefreshCw, Search } from 'lucide-react';
interface Props { users: UserAccount[]; readingLogs: UserReadingActivity[]; error: string | null; isLoading: boolean; searchQuery: string; onSearchQueryChange: (value: string) => void; onRefresh: () => void; onExportCsv: () => void; }
export function UsersTab({ users: userList, readingLogs, error, isLoading, searchQuery: userSearchQuery, onSearchQueryChange, onRefresh, onExportCsv: handleExportUsersCSV }: Props) {
const filteredUsers = userList.filter(
  (user) =>
    user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (user.phone && user.phone.includes(userSearchQuery))
);
return (
<div className="flex flex-col gap-6">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>
      <h3 className="text-xl mb-1">Orang tua terdaftar ({userList.length})</h3>
      <p className="text-xs text-secondary font-medium">
        Pantau akun orang tua, kontak, dan aktivitas membaca keluarga.
      </p>
    </div>

    <div className="flex items-center gap-2">
      <button type="button" onClick={onRefresh} disabled={isLoading} className="btn-secondary py-2.5 px-3 text-xs flex items-center gap-2 disabled:opacity-60">
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        <span>Muat ulang</span>
      </button>
      <button
        onClick={handleExportUsersCSV}
        disabled={isLoading || userList.length === 0}
        className="btn-primary py-2.5 px-4 text-xs flex items-center gap-2 shrink-0 disabled:opacity-60"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>Ekspor CSV (Mailchimp/Kirim.Email)</span>
      </button>
    </div>
  </div>

  {error && (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{error}</span>
    </div>
  )}

  {/* Search filter */}
  <div className="relative">
    <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted" />
    <input
      type="text"
      value={userSearchQuery}
      onChange={(e) => onSearchQueryChange(e.target.value)}
      placeholder="Cari berdasarkan nama, email, atau nomor WhatsApp..."
      className="w-full pl-10 pr-3 py-2 rounded-xl border border-default bg-surface text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue"
    />
  </div>

  {/* User List Table */}
  <div className="rounded-2xl border border-default overflow-hidden bg-surface shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-surface text-secondary font-bold text-[10px]">
          <tr>
            <th className="p-3">Nama Orang Tua</th>
            <th className="p-3">Email</th>
            <th className="p-3">No. WhatsApp</th>
            <th className="p-3">Metode Login</th>
            <th className="p-3">Tanggal Daftar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-default font-medium">
          {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-surface-hover transition-colors">
                <td className="p-3 font-bold text-primary">{u.name}</td>
                <td className="p-3 text-secondary">{u.email}</td>
                <td className="p-3 text-secondary">{u.phone || '-'}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full bg-surface border border-default text-primary text-[10px] font-bold uppercase">
                    {u.loginMethod}
                  </span>
                </td>
                <td className="p-3 text-muted">
                  {new Date(u.createdAt).toLocaleDateString('id-ID')}
                </td>
              </tr>
            ))}
          {!isLoading && filteredUsers.length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-muted">
                {userSearchQuery ? 'Tidak ada pengguna yang cocok dengan pencarian.' : 'Belum ada pengguna aplikasi yang terdaftar.'}
              </td>
            </tr>
          )}
          {isLoading && userList.length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-muted">Memuat pengguna terdaftar...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>

  {/* Reading Logs Section */}
  <div className="flex flex-col gap-3 pt-4 border-t border-default">
    <h3 className="text-base font-extrabold font-sans mb-1 flex items-center gap-2">
      <BookOpen className="w-4 h-4 text-warning" />
      <span>Aktivitas membaca terbaru</span>
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {readingLogs.map((log, idx) => (
        <div
          key={idx}
          className="p-3 rounded-xl bg-surface border border-default flex flex-col gap-1 text-xs"
        >
          <div className="flex items-center justify-between font-bold text-primary">
            <span>{log.userName}</span>
            <span className="text-[10px] font-normal text-muted">
              {new Date(log.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="text-secondary font-semibold truncate">
            📖 {log.storyTitle}
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-muted">Halaman {log.lastPageRead} dari {log.totalPages}</span>
            {log.isCompleted ? (
              <span className="text-brand-green font-bold">Selesai</span>
            ) : (
              <span className="text-warning font-bold">Sedang dibaca</span>
            )}
          </div>
        </div>
      ))}
      {!isLoading && readingLogs.length === 0 && (
        <div className="md:col-span-3 rounded-xl border border-dashed border-default p-6 text-center text-xs text-muted">
          Belum ada aktivitas membaca dari pengguna terdaftar.
        </div>
      )}
    </div>
  </div>
</div>
); }

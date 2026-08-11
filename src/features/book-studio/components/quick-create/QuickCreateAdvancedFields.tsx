import type { Dispatch, SetStateAction } from 'react';
import type { QuickCreateForm } from '@/features/book-studio/types';

interface QuickCreateAdvancedFieldsProps {
  form: QuickCreateForm;
  onFormChange: Dispatch<SetStateAction<QuickCreateForm>>;
}

export function QuickCreateAdvancedFields({
  form,
  onFormChange,
}: QuickCreateAdvancedFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-[1.25rem] border border-default bg-surface p-3.5">
      <div>
        <label className="block font-bold mb-1">Judul <span className="font-semibold text-secondary">(opsional)</span></label>
        <input
          type="text"
          value={form.title}
          onChange={(event) => onFormChange({ ...form, title: event.target.value })}
          className="reader-field w-full px-3 py-2.5 rounded-xl"
          placeholder="Biarkan AI memilih judul"
        />
      </div>
      <div>
        <label className="block font-bold mb-1">Jumlah halaman</label>
        <select
          value={form.pageCount}
          onChange={(event) => onFormChange({ ...form, pageCount: Number(event.target.value) as QuickCreateForm['pageCount'] })}
          className="reader-field w-full px-3 py-2.5 rounded-xl"
        >
          <option value={8}>8 halaman — ringkas</option>
          <option value={10}>10 halaman — standar</option>
          <option value={12}>12 halaman — lebih lengkap</option>
        </select>
      </div>
      <div>
        <label className="block font-bold mb-1">Pesan yang ingin disampaikan</label>
        <input
          type="text"
          value={form.moralMessage}
          onChange={(event) => onFormChange({ ...form, moralMessage: event.target.value })}
          className="reader-field w-full px-3 py-2.5 rounded-xl"
          placeholder="Misalnya berani mencoba"
        />
      </div>
      <div>
        <label className="block font-bold mb-1">Gaya ilustrasi</label>
        <select
          value={form.visualPreset}
          onChange={(event) => onFormChange({ ...form, visualPreset: event.target.value as QuickCreateForm['visualPreset'] })}
          className="reader-field w-full px-3 py-2.5 rounded-xl"
        >
          <option value="auto">Otomatis sesuai usia</option>
          <option value="soft-2d-cartoon">Soft 2D cartoon</option>
          <option value="colorful-storybook">Colorful storybook</option>
          <option value="stylized-adventure-cartoon">Stylized adventure</option>
        </select>
      </div>
      <div>
        <label className="block font-bold mb-1">Gambaran karakter</label>
        <textarea
          rows={3}
          value={form.characterHints}
          onChange={(event) => onFormChange({ ...form, characterHints: event.target.value })}
          className="reader-field w-full px-3 py-2.5 rounded-xl leading-5"
          placeholder="Nama, ciri fisik, pakaian, atau sifat"
        />
      </div>
      <div>
        <label className="block font-bold mb-1">Konten yang dihindari</label>
        <textarea
          rows={3}
          value={form.tabooContent}
          onChange={(event) => onFormChange({ ...form, tabooContent: event.target.value })}
          className="reader-field w-full px-3 py-2.5 rounded-xl leading-5"
          placeholder="Pisahkan dengan koma, misalnya laba-laba, suasana gelap"
        />
      </div>
    </div>
  );
}

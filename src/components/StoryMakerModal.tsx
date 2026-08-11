import React, { useState } from 'react';
import { Story } from '../types';
import { X, Wand2, Sparkles, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { userAuthStore } from '../utils/userAuthStore';

interface StoryMakerModalProps {
  onClose: () => void;
  onStoryCreated: (newStory: Story) => void;
}

export const StoryMakerModal: React.FC<StoryMakerModalProps> = ({
  onClose,
  onStoryCreated,
}) => {
  const [characterName, setCharacterName] = useState('Mimi');
  const [characterType, setCharacterType] = useState('Kucing Cerdas');
  const [setting, setSetting] = useState('Hutan Ajaib');
  const [moralValue, setMoralValue] = useState('Saling Membantu & Menjaga Kebersihan');
  const [pageCount, setPageCount] = useState<number>(6);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const characterTypes = ['Kucing Cerdas', 'Dinosaurus Ramah', 'Astronaut Cilik', 'Putri Bintang', 'Robot Ceria', 'Kelinci Lincah', 'Naga Biru'];
  const settingsList = ['Hutan Ajaib', 'Luar Angkasa', 'Bawah Laut', 'Istana Awan', 'Taman Bunga Pelangi'];
  const moralValues = ['Saling Membantu', 'Keberanian & Kepercayaan Diri', 'Menjaga Kebersihan Lingkungan', 'Kejujuran & Kebaikan Hati'];

  const user = userAuthStore.getUser();
  const aiQuotaUsed = user?.aiStoriesUsed || 0;
  const maxQuota = 10;
  const quotaRemaining = Math.max(0, maxQuota - aiQuotaUsed);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName,
          characterType,
          setting,
          moralValue,
          pageCount,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi server Gemini AI');
      }

      const data = await response.json();
      if (data.story) {
        await userAuthStore.recordAiStoryUsed();
        onStoryCreated(data.story);
        onClose();
      } else {
        throw new Error('Format cerita dari AI tidak valid');
      }
    } catch (err: unknown) {
      console.warn('AI Story Generation error, generating local fallback story:', err);
      // Fallback story generation so user always gets a generated story
      const fallbackStory: Story = {
        id: `custom-${Date.now()}`,
        title: `Petualangan ${characterName} di ${setting}`,
        author: 'AI Story Creator',
        category: 'Cerita Kustom AI',
        coverImage: setting === 'Luar Angkasa' ? 'space' : setting === 'Bawah Laut' ? 'sea' : 'forest',
        coverBg: 'from-purple-600 via-pink-600 to-rose-600',
        themeColor: 'purple',
        accentColor: '#9333EA',
        targetAge: '3-9 Tahun',
        description: `Kisah ajaib ${characterName} si ${characterType} yang menjelajahi ${setting} dan belajar tentang ${moralValue}.`,
        moralMessage: `Pesan Moral: ${moralValue}`,
        pages: Array.from({ length: pageCount }).map((_, idx) => ({
          pageNumber: idx + 1,
          title: `Bab ${idx + 1}: ${characterName} & Keajaiban ${setting}`,
          text: idx === 0
            ? `Pada suatu hari yang cerah di ${setting}, hiduplah ${characterName} si ${characterType} yang penuh rasa ingin tahu.`
            : idx === pageCount - 1
            ? `${characterName} tersenyum bahagia. Petualangan di ${setting} mengajarinya bahwa ${moralValue} adalah kunci kebahagiaan bersama!`
            : `${characterName} melangkah berani menyusuri ${setting}. Di sepanjang jalan, ia bertemu teman-teman baru yang ramah dan saling membantu.`,
          illustrationType: setting === 'Luar Angkasa' ? 'space' : setting === 'Bawah Laut' ? 'sea' : setting === 'Istana Awan' ? 'dragon' : 'forest',
          colors: {
            bgGradFrom: '#faf5ff',
            bgGradTo: '#e9d5ff',
            textBg: 'bg-purple-950/80',
            accentColor: '#9333ea',
            borderAccent: '#c084fc',
          },
          interactiveElements: [
            {
              id: `elem-${idx}`,
              type: 'character',
              label: characterName,
              x: 50,
              y: 50,
              animation: 'bounce',
              soundType: 'pop',
              dialogue: `Halo! Aku ${characterName}!`,
              emoji: '🌟',
            },
          ],
        })),
      };

      await userAuthStore.recordAiStoryUsed();
      onStoryCreated(fallbackStory);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-overlay)] backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="reader-modal border-2 border-brand-gold rounded-[1.35rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b reader-divider flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-brand-gold text-white shadow-md">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-primary">Buat Buku Cerita AI</h3>
              <p className="text-xs text-secondary">Rancang tokoh, petualangan, dan pesan moral sendiri!</p>
            </div>
          </div>
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] uppercase font-bold text-brand-gold">Kuota VIP</span>
            <span className="text-sm font-black text-primary">{quotaRemaining} <span className="text-brand-gold">/ {maxQuota}</span></span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-hover transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-error/10 border border-error rounded-2xl text-xs text-error">
              {errorMessage}
            </div>
          )}

          {/* Character Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-primary">
              Nama Tokoh Utama
            </label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              required
              placeholder="Contoh: Kiko, Milo, Loli"
              className="px-4 py-2.5 rounded-2xl reader-soft-panel border border-default text-primary font-bold focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>

          {/* Character Type Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-primary">
              Jenis Tokoh
            </label>
            <div className="flex flex-wrap gap-2">
              {characterTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCharacterType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    characterType === type
                      ? 'bg-brand-gold text-white shadow-md'
                      : 'reader-soft-panel text-secondary hover:text-primary hover:bg-surface-hover border border-default'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Setting Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-primary">
              Latar Tempat Petualangan
            </label>
            <div className="flex flex-wrap gap-2">
              {settingsList.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSetting(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    setting === st
                      ? 'bg-brand-gold text-white shadow-md'
                      : 'reader-soft-panel text-secondary hover:text-primary hover:bg-surface-hover border border-default'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Moral Value Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-primary">
              Pesan Moral
            </label>
            <div className="flex flex-wrap gap-2">
              {moralValues.map((mv) => (
                <button
                  key={mv}
                  type="button"
                  onClick={() => setMoralValue(mv)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    moralValue === mv
                      ? 'bg-brand-gold text-white shadow-md'
                      : 'reader-soft-panel text-secondary hover:text-primary hover:bg-surface-hover border border-default'
                  }`}
                >
                  {mv}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl reader-soft-panel hover:bg-surface-hover text-secondary hover:text-primary font-bold text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || quotaRemaining <= 0}
              className="px-6 py-2.5 rounded-2xl bg-brand-gold hover:opacity-90 text-white font-black text-sm flex items-center gap-2 shadow-xl disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Merancang Cerita...</span>
                </>
              ) : quotaRemaining <= 0 ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span>Kuota Habis</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>Ciptakan Cerita Ajaib</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

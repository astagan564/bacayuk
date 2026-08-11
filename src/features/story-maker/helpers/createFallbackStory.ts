import type { Story } from '@/types';
import type { StoryMakerFormState } from '@/features/story-maker/types';

function getIllustrationType(setting: string): 'space' | 'sea' | 'dragon' | 'forest' {
  if (setting === 'Luar Angkasa') return 'space';
  if (setting === 'Bawah Laut') return 'sea';
  if (setting === 'Istana Awan') return 'dragon';
  return 'forest';
}

export function createFallbackStory(form: StoryMakerFormState): Story {
  const { characterName, characterType, setting, moralValue, pageCount } = form;
  const illustrationType = getIllustrationType(setting);

  return {
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
    pages: Array.from({ length: pageCount }, (_, pageIndex) => ({
      pageNumber: pageIndex + 1,
      title: `Bab ${pageIndex + 1}: ${characterName} & Keajaiban ${setting}`,
      text: pageIndex === 0
        ? `Pada suatu hari yang cerah di ${setting}, hiduplah ${characterName} si ${characterType} yang penuh rasa ingin tahu.`
        : pageIndex === pageCount - 1
          ? `${characterName} tersenyum bahagia. Petualangan di ${setting} mengajarinya bahwa ${moralValue} adalah kunci kebahagiaan bersama!`
          : `${characterName} melangkah berani menyusuri ${setting}. Di sepanjang jalan, ia bertemu teman-teman baru yang ramah dan saling membantu.`,
      illustrationType,
      colors: {
        bgGradFrom: '#faf5ff',
        bgGradTo: '#e9d5ff',
        textBg: 'bg-purple-950/80',
        accentColor: '#9333ea',
        borderAccent: '#c084fc',
      },
      interactiveElements: [{
        id: `elem-${pageIndex}`,
        type: 'character',
        label: characterName,
        x: 50,
        y: 50,
        animation: 'bounce',
        soundType: 'pop',
        dialogue: `Halo! Aku ${characterName}!`,
        emoji: '🌟',
      }],
    })),
  };
}

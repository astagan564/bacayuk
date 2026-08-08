export interface VocabDefinition {
  word: string;
  category: 'Alam' | 'Lautan' | 'Angkasa' | 'Pelajaran' | 'Benda' | 'Sifat';
  definition: string;
  icon: string; // Emoji string
  pronunciation?: string;
  example?: string;
}

export const VOCABULARY_DICTIONARY: Record<string, VocabDefinition> = {
  'embun': {
    word: 'Embun',
    category: 'Alam',
    definition: 'Tetes-tetes air jernih dan segar yang menempel pada daun di pagi hari.',
    icon: '💧',
    pronunciation: 'em-bun',
    example: 'Rumput hijau dipenuhi embun pagi yang dingin.',
  },
  'padang rumput': {
    word: 'Padang Rumput',
    category: 'Alam',
    definition: 'Lapangan luas yang penuh ditumbuhi rumput hijau tempat hewan bermain.',
    icon: '🌾',
    pronunciation: 'pa-dang rum-put',
    example: 'Kiko berlari riang di padang rumput.',
  },
  'peta rahasia': {
    word: 'Peta Rahasia',
    category: 'Benda',
    definition: 'Gambar petunjuk khusus untuk menemukan lokasi atau harta karun tersembunyi.',
    icon: '📜',
    pronunciation: 'pe-ta ra-ha-si-a',
    example: 'Bubu mencari peta rahasia yang jatuh.',
  },
  'teka-teki': {
    word: 'Teka-Teki',
    category: 'Pelajaran',
    definition: 'Soal atau tebakan menyenangkan yang melatih otak kita berpikir cerdas.',
    icon: '🧩',
    pronunciation: 'te-ka te-ki',
    example: 'Kiko menjawab teka-teki dari burung hantu.',
  },
  'sahabat': {
    word: 'Sahabat',
    category: 'Sifat',
    definition: 'Teman dekat dan setia yang selalu saling membantu dan peduli satu sama lain.',
    icon: '🤝',
    pronunciation: 'sa-ha-bat',
    example: 'Kiko dan Bubu adalah sahabat sejati.',
  },
  'samudra': {
    word: 'Samudra',
    category: 'Lautan',
    definition: 'Lautan yang sangat luas dan dalam yang mengelilingi daratan bumi.',
    icon: '🌊',
    pronunciation: 'sa-mud-ra',
    example: 'Penyu tua berenang menyeberangi samudra luas.',
  },
  'terumbu karang': {
    word: 'Terumbu Karang',
    category: 'Lautan',
    definition: 'Taman indah berbentuk istana di dasar laut tempat rumah bagi ikan-ikan.',
    icon: '🪸',
    pronunciation: 'te-rum-bu ka-rang',
    example: 'Ikan-ikan bersembunyi di sela terumbu karang.',
  },
  'lumba-lumba': {
    word: 'Lumba-Lumba',
    category: 'Lautan',
    definition: 'Mamalia laut yang sangat cerdas, ramah, dan suka melompat gembira.',
    icon: '🐬',
    pronunciation: 'lum-ba lum-ba',
    example: 'Lumba-lumba menyapa kapal penyelam.',
  },
  'mutiara': {
    word: 'Mutiara',
    category: 'Benda',
    definition: 'Batu permata bening berkilau yang berasal dari dalam cangkang kerang laut.',
    icon: '🦪',
    pronunciation: 'mu-ti-a-ra',
    example: 'Kerang ajaib itu menyimpan mutiara bersinar.',
  },
  'penyu': {
    word: 'Penyu',
    category: 'Lautan',
    definition: 'Kura-kura laut berukuran besar yang pandai berenang menjelajah samudra.',
    icon: '🐢',
    pronunciation: 'pe-nyu',
    example: 'Penyu tua membimbing ikan-ikan kecil.',
  },
  'kompas': {
    word: 'Kompas',
    category: 'Benda',
    definition: 'Alat petunjuk arah mata angin (Utara, Selatan, Timur, Barat) agar tidak tersesat.',
    icon: '🧭',
    pronunciation: 'kom-pas',
    example: 'Kapten menggunakan kompas untuk menentukan arah.',
  },
  'astronot': {
    word: 'Astronot',
    category: 'Angkasa',
    definition: 'Penjelajah pemberani yang terbang naik roket menuju ruang angkasa luar.',
    icon: '🧑‍🚀',
    pronunciation: 'as-tro-not',
    example: 'Astronot melihat planet bumi dari luar angkasa.',
  },
  'galaksi': {
    word: 'Galaksi',
    category: 'Angkasa',
    definition: 'Kumpulan raksasa jutaan bintang, gas, dan planet yang bersinar di semesta.',
    icon: '🌌',
    pronunciation: 'ga-lak-si',
    example: 'Galaksi Bima Sakti dipenuhi bintang berkilau.',
  },
  'nebula': {
    word: 'Nebula',
    category: 'Angkasa',
    definition: 'Awan raksasa warna-warni terbuat dari debu dan gas ajaib di luar angkasa.',
    icon: '☁️',
    pronunciation: 'ne-bu-la',
    example: 'Mata melihat nebula ungu yang menakjubkan.',
  },
  'teropong': {
    word: 'Teropong',
    category: 'Benda',
    definition: 'Alat khusus untuk melihat benda-benda yang sangat jauh agar terlihat dekat dan jelas.',
    icon: '🔭',
    pronunciation: 'te-ro-pong',
    example: 'Miko meneropong bintang malam dengan teropong ajaib.',
  },
  'meteor': {
    word: 'Meteor',
    category: 'Angkasa',
    definition: 'Batu angkasa yang meluncur deras dan menyala terang seperti bintang jatuh.',
    icon: '☄️',
    pronunciation: 'me-te-or',
    example: 'Lihat, ada meteor melintas di langit malam!',
  },
  'kastil': {
    word: 'Kastil',
    category: 'Benda',
    definition: 'Istana raksasa yang megah berpuncak tinggi tempat tinggal raja dan ratu.',
    icon: '🏰',
    pronunciation: 'kas-til',
    example: 'Naga kecil tinggal di kastil puncak gunung.',
  },
  'kristal': {
    word: 'Kristal',
    category: 'Benda',
    definition: 'Batu bening dan keras yang memancarkan kilau warna-warni sangat indah.',
    icon: '💎',
    pronunciation: 'kris-tal',
    example: 'Kristal ajaib itu mengeluarkan cahaya lembut.',
  },
  'seruling': {
    word: 'Seruling',
    category: 'Benda',
    definition: 'Alat musik tiup kecil yang menghasilkan alunan nada suara merdu.',
    icon: '🎵',
    pronunciation: 'se-ru-ling',
    example: 'Suara seruling menenangkan naga yang gelisah.',
  },
  'pesona': {
    word: 'Pesona',
    category: 'Sifat',
    definition: 'Keindahan atau daya tarik yang sangat luar biasa hingga memikat hati.',
    icon: '✨',
    pronunciation: 'pe-so-na',
    example: 'Taman bunga itu penuh pesona menakjubkan.',
  },
  'pelangi': {
    word: 'Pelangi',
    category: 'Alam',
    definition: 'Lengkungan indah tujuh warna di langit yang muncul setelah hujan turun.',
    icon: '🌈',
    pronunciation: 'pe-lan-gi',
    example: 'Pelangi muncul menghiasi langit cerah.',
  },
  'merdu': {
    word: 'Merdu',
    category: 'Sifat',
    definition: 'Suara atau nada musik yang sangat enak, lembut, dan indah didengar.',
    icon: '🎶',
    pronunciation: 'mer-du',
    example: 'Burung bernyanyi dengan suara sangat merdu.',
  },
  'keberanian': {
    word: 'Keberanian',
    category: 'Sifat',
    definition: 'Sikap pantang menyerah dan berani menghadapi tantangan demi kebaikan.',
    icon: '🦁',
    pronunciation: 'ke-be-ra-ni-an',
    example: 'Keberanian Kiko menyelamatkan temannya.',
  },
};

// Helper function to find matching vocab definitions in a given text
export function findVocabMatches(text: string): { wordKey: string; vocab: VocabDefinition }[] {
  const matches: { wordKey: string; vocab: VocabDefinition }[] = [];
  const lowerText = text.toLowerCase();

  // Sort keys by length descending to match multi-word entries first ("peta rahasia", "padang rumput")
  const sortedKeys = Object.keys(VOCABULARY_DICTIONARY).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (lowerText.includes(key)) {
      matches.push({
        wordKey: key,
        vocab: VOCABULARY_DICTIONARY[key],
      });
    }
  }

  return matches;
}

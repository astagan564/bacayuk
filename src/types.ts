export interface InteractiveElement {
  id: string;
  type: 'animal' | 'star' | 'item' | 'sound' | 'character';
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  animation: 'hop' | 'spin' | 'bounce' | 'glow' | 'pulse' | 'float';
  soundType?: 'pop' | 'chime' | 'giggle' | 'magic' | 'sparkle' | 'roar' | 'splash';
  dialogue?: string;
  emoji?: string;
  iconName?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface GlossaryItem {
  id: string;
  wordEn: string;
  translationId: string;
  phonetic?: string;
  emoji?: string;
  exampleEn?: string;
  exampleId?: string;
}

export interface VocabularyQuizQuestion {
  wordEn: string;
  correctTranslationId: string;
  optionsId: string[];
  emoji?: string;
  phonetic?: string;
}

export interface VocabularyQuiz {
  title: string;
  description: string;
  questions: VocabularyQuizQuestion[];
}

export interface StoryPage {
  pageNumber: number;
  title?: string;
  text: string;
  textEn?: string; // English translation for bilingual mode
  illustrationType: 'forest' | 'dragon' | 'space' | 'sea' | 'castle' | 'garden' | 'custom';
  illustrationPrompt?: string;
  customSvgPath?: string;
  colors: {
    bgGradFrom: string;
    bgGradTo: string;
    textBg: string;
    accentColor: string;
    borderAccent: string;
  };
  interactiveElements?: InteractiveElement[];
  quizQuestion?: QuizQuestion;
}

export interface Story {
  id: string;
  title: string;
  titleEn?: string;
  author: string;
  category: string;
  coverImage: string;
  coverBg: string;
  themeColor: string;
  accentColor: string;
  pages: StoryPage[];
  moralMessage: string;
  targetAge: string;
  description: string;
  accessStatus?: 'free_guest' | 'free_member' | 'paid';
  downloadEnabled?: boolean;
  ebookPrice?: number;
  pdfUrl?: string;
  epubUrl?: string;
  watermarkEnabled?: boolean;
  status?: 'draft' | 'published';
  glossary?: GlossaryItem[];
  vocabularyQuiz?: VocabularyQuiz;
}

export type DisplayView = 'double' | 'single';

export interface ReadingSettings {
  autoPlay: boolean;
  autoPlayDelay: number; // seconds per page
  soundFx: boolean;
  pageAudioFx: boolean;
  bgMusic: boolean;
  speechRate: number; // 0.5 to 1.5
  speechPitch: number; // 0.5 to 1.5
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  displayView: DisplayView;
  themeMode: 'day' | 'night';
  languageMode: 'id' | 'en' | 'dual'; // Bilingual reading toggle mode
}

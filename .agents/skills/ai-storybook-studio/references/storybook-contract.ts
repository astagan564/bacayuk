export type PrimaryLanguage = 'id' | 'en';
export type TargetAge = '3-5' | '6-8' | '9-12';
export type VisualPreset =
  | 'soft-2d-cartoon'
  | 'colorful-storybook'
  | 'stylized-adventure-cartoon';

export interface GenerateStorybookInput {
  brief: string;
  targetAge: TargetAge;
  primaryLanguage: PrimaryLanguage;
  title?: string;
  moralMessage?: string;
  characterHints?: string;
  pageCount?: number;
  visualPreset?: VisualPreset;
  tabooContent?: string[];
}

export interface InteractiveElement {
  id: string;
  type: 'animal' | 'star' | 'item' | 'sound' | 'character';
  label: string;
  x: number;
  y: number;
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

export interface StoryPageColors {
  bgGradFrom: string;
  bgGradTo: string;
  textBg: string;
  accentColor: string;
  borderAccent: string;
}

export interface StoryPage {
  pageNumber: number;
  title?: string;
  titleEn?: string;
  text: string;
  textEn?: string;
  illustrationType: 'forest' | 'dragon' | 'space' | 'sea' | 'castle' | 'garden' | 'custom';
  imageUrl?: string;
  illustrationPrompt?: string;
  customSvgPath?: string;
  colors: StoryPageColors;
  interactiveElements?: InteractiveElement[];
  quizQuestion?: QuizQuestion;
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
  pipelineStatus?: 'draft' | 'story_complete' | 'illustrated' | 'enhanced' | 'ready_to_publish';
  glossary?: GlossaryItem[];
  vocabularyQuiz?: VocabularyQuiz;
  productionGuide?: StorybookProductionGuide;
}

export interface GeneratedStoryPage extends StoryPage {
  title: string;
  illustrationPrompt: string;
}

export interface GeneratedStory extends Omit<Story, 'pages' | 'status' | 'pipelineStatus' | 'productionGuide'> {
  pages: GeneratedStoryPage[];
  status: 'draft';
  pipelineStatus: 'story_complete' | 'illustrated' | 'enhanced';
  productionGuide: StorybookProductionGuide;
}

export interface CharacterBibleEntry {
  id: string;
  name: string;
  role: 'main' | 'supporting' | 'background';
  speciesOrIdentity: string;
  ageAppearance: string;
  bodyAndFace: string;
  skinFurOrHair: string;
  outfit: string;
  accessories: string[];
  signatureColors: string[];
  personality: string[];
  expressionGuide: string[];
  immutableTraits: string[];
}

export interface StorybookProductionGuide {
  visualPreset: VisualPreset;
  aspectRatio: '3:4' | '4:3' | '1:1' | '16:9';
  characterBible: CharacterBibleEntry[];
  palette: string[];
  coverPrompt: string;
  continuityRules: string[];
  negativePrompt: string;
}

export interface StorybookReview {
  status: 'needs_review';
  checklist: string[];
  warnings: string[];
}

export interface GeneratedStorybookPackage {
  schemaVersion: '1.0';
  story: GeneratedStory;
  review: StorybookReview;
}

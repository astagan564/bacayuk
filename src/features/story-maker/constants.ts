import type { StoryMakerFormState } from '@/features/story-maker/types';

export const STORY_MAKER_MAX_QUOTA = 10;

export const DEFAULT_STORY_MAKER_FORM: StoryMakerFormState = {
  characterName: 'Mimi',
  characterType: 'Kucing Cerdas',
  setting: 'Hutan Ajaib',
  moralValue: 'Saling Membantu & Menjaga Kebersihan',
  pageCount: 6,
};

export const CHARACTER_TYPES = [
  'Kucing Cerdas',
  'Dinosaurus Ramah',
  'Astronaut Cilik',
  'Putri Bintang',
  'Robot Ceria',
  'Kelinci Lincah',
  'Naga Biru',
] as const;

export const STORY_SETTINGS = [
  'Hutan Ajaib',
  'Luar Angkasa',
  'Bawah Laut',
  'Istana Awan',
  'Taman Bunga Pelangi',
] as const;

export const MORAL_VALUES = [
  'Saling Membantu',
  'Keberanian & Kepercayaan Diri',
  'Menjaga Kebersihan Lingkungan',
  'Kejujuran & Kebaikan Hati',
] as const;

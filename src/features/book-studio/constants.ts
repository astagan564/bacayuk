import type { Story } from '@/types';
import type { QuickCreateForm } from './types';

export const DEFAULT_QUICK_CREATE_FORM: QuickCreateForm = {
  storyId: '', brief: '', targetAge: '6-8', primaryLanguage: 'id', title: '', moralMessage: '',
  characterHints: '', pageCount: 10, visualPreset: 'auto', tabooContent: '',
};

export const MAX_PDF_IMPORT_SIZE = 400 * 1024 * 1024;
export const MAX_PDF_MANUSCRIPT_LENGTH = 22_000;

export const PIPELINE_STEPS: Array<{ id: NonNullable<Story['pipelineStatus']>; label: string }> = [
  { id: 'draft', label: 'Draft' },
  { id: 'story_complete', label: 'Story Complete' },
  { id: 'illustrated', label: 'Illustrated' },
  { id: 'enhanced', label: 'Enhanced' },
  { id: 'ready_to_publish', label: 'Ready to Publish' },
];

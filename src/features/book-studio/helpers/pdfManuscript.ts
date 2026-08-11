import { MAX_PDF_MANUSCRIPT_LENGTH } from '@/features/book-studio/constants';

export interface PdfSourcePage {
  pageNumber: number;
  text: string;
}

export function getSuggestedPdfTitle(fileName: string): string {
  return fileName
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildPdfManuscript(
  sourcePages: PdfSourcePage[],
  maxLength = MAX_PDF_MANUSCRIPT_LENGTH,
): { manuscript: string; readablePageCount: number } {
  const readablePages = sourcePages.filter((sourcePage) => sourcePage.text);
  if (readablePages.length === 0) {
    throw new Error('Teks tidak ditemukan pada PDF ini, termasuk setelah OCR. Tambahkan naskah secara manual atau gunakan PDF lain.');
  }

  let remainingCharacters = maxLength;
  const manuscript = readablePages.flatMap(({ pageNumber, text }) => {
    const heading = `## Halaman sumber ${pageNumber}\n`;
    const availableCharacters = remainingCharacters - heading.length;
    if (availableCharacters < 120) return [];
    const pageText = text.slice(0, availableCharacters).trim();
    remainingCharacters -= heading.length + pageText.length + 2;
    return [`${heading}${pageText}`];
  }).join('\n\n').trim();

  if (manuscript.length < 12) {
    throw new Error('Teks PDF terlalu sedikit untuk dibuat menjadi buku. Tambahkan naskah atau pilih PDF lain.');
  }

  return { manuscript, readablePageCount: readablePages.length };
}

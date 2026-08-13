import jsPDF from 'jspdf';
import type { Story } from '@/types';
import type { CustomerInfo } from '@/features/commerce/download/types';

interface PrintableImage {
  dataUrl: string;
  width: number;
  height: number;
}

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const SAFE_MARGIN = 14;

function cleanPdfText(value: string | undefined): string {
  return String(value || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadPrintableImage(url: string | undefined): Promise<PrintableImage | null> {
  if (!url?.trim()) return null;

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob());
    const longestSide = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, 2200 / longestSide);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas tidak tersedia.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      width,
      height,
    };
  } catch (error) {
    console.warn('Gambar PDF tidak dapat dimuat:', url, error);
    return null;
  }
}

function drawImageCover(
  doc: jsPDF,
  image: PrintableImage,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;
  let renderWidth = width;
  let renderHeight = height;
  let renderX = x;
  let renderY = y;

  if (sourceRatio > targetRatio) {
    renderWidth = height * sourceRatio;
    renderX = x - (renderWidth - width) / 2;
  } else {
    renderHeight = width / sourceRatio;
    renderY = y - (renderHeight - height) / 2;
  }

  doc.saveGraphicsState();
  // jsPDF keeps the current path alive after clip(). Discarding it is required;
  // otherwise every element drawn afterwards (story panel and license footer)
  // remains clipped to the illustration rectangle.
  doc.rect(x, y, width, height, null).clip().discardPath();
  doc.addImage(image.dataUrl, 'JPEG', renderX, renderY, renderWidth, renderHeight, undefined, 'FAST');
  doc.restoreGraphicsState();
}

function addLicenseFooter(doc: jsPDF, story: Story, customer: CustomerInfo, pageNumber: number) {
  doc.setDrawColor(218, 213, 202);
  doc.setLineWidth(0.25);
  doc.line(SAFE_MARGIN, 285, PAGE_WIDTH - SAFE_MARGIN, 285);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(112, 105, 94);
  doc.text(
    `Lisensi pribadi: ${cleanPdfText(customer.name)} (${cleanPdfText(customer.email)}) | #${cleanPdfText(customer.transactionId)}`,
    SAFE_MARGIN,
    290,
  );
  doc.text(`${cleanPdfText(story.title)}  -  ${pageNumber}`, PAGE_WIDTH - SAFE_MARGIN, 290, { align: 'right' });
}

function drawMissingIllustration(doc: jsPDF, title: string) {
  doc.setFillColor(231, 242, 234);
  doc.rect(0, 0, PAGE_WIDTH, 195, 'F');
  doc.setFillColor(205, 229, 213);
  doc.circle(35, 48, 22, 'F');
  doc.setFillColor(245, 218, 145);
  doc.circle(170, 38, 15, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(43, 83, 59);
  doc.text(cleanPdfText(title), PAGE_WIDTH / 2, 104, { align: 'center', maxWidth: 160 });
}

function addCover(doc: jsPDF, story: Story, customer: CustomerInfo, cover: PrintableImage | null) {
  doc.setFillColor(250, 247, 239);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  if (cover) {
    drawImageCover(doc, cover, 0, 0, PAGE_WIDTH, 225);
  } else {
    drawMissingIllustration(doc, story.title);
  }

  doc.setFillColor(20, 34, 29);
  doc.setGState(doc.GState({ opacity: 0.78 }));
  doc.roundedRect(12, 157, PAGE_WIDTH - 24, 58, 5, 5, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(244, 196, 83);
  doc.text(cleanPdfText(story.category).toUpperCase(), PAGE_WIDTH / 2, 169, { align: 'center' });

  const title = doc.splitTextToSize(cleanPdfText(story.title), 160);
  doc.setFontSize(title.length > 2 ? 22 : 27);
  doc.setTextColor(255, 255, 255);
  doc.text(title, PAGE_WIDTH / 2, 183, { align: 'center', lineHeightFactor: 1.05 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(239, 235, 225);
  doc.text(`Cerita oleh ${cleanPdfText(story.author)}`, PAGE_WIDTH / 2, 207, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(41, 78, 57);
  doc.text('BacaYuk  |  Buku Cerita Anak', SAFE_MARGIN, 239);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(72, 67, 58);
  const description = doc.splitTextToSize(cleanPdfText(story.description), PAGE_WIDTH - SAFE_MARGIN * 2);
  doc.text(description, SAFE_MARGIN, 248, { lineHeightFactor: 1.35 });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(95, 89, 78);
  doc.text(`Untuk usia ${cleanPdfText(story.targetAge)}  |  ${cleanPdfText(story.moralMessage)}`, SAFE_MARGIN, 274, {
    maxWidth: PAGE_WIDTH - SAFE_MARGIN * 2,
  });
  addLicenseFooter(doc, story, customer, 1);
}

function addStoryPage(
  doc: jsPDF,
  story: Story,
  customer: CustomerInfo,
  pageIndex: number,
  image: PrintableImage | null,
) {
  const page = story.pages[pageIndex];
  doc.addPage();
  doc.setFillColor(250, 247, 239);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  if (image) drawImageCover(doc, image, 0, 0, PAGE_WIDTH, 195);
  else drawMissingIllustration(doc, page.title || `Halaman ${page.pageNumber}`);

  doc.setFillColor(21, 77, 55);
  doc.circle(190, 17, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(String(page.pageNumber), 190, 20.5, { align: 'center' });

  doc.setFillColor(255, 253, 248);
  doc.setDrawColor(224, 217, 203);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, 178, PAGE_WIDTH - 20, 104, 7, 7, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(31, 58, 45);
  doc.text(cleanPdfText(page.title || `Halaman ${page.pageNumber}`), 18, 194, { maxWidth: 174 });

  const storyText = doc.splitTextToSize(cleanPdfText(page.text), 174);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12.5);
  doc.setTextColor(47, 45, 40);
  doc.text(storyText, 18, 207, { lineHeightFactor: 1.42 });

  if (page.textEn) {
    const englishY = Math.min(254, 210 + storyText.length * 6.3);
    doc.setDrawColor(226, 218, 200);
    doc.line(18, englishY - 5, PAGE_WIDTH - 18, englishY - 5);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.2);
    doc.setTextColor(105, 99, 88);
    const englishText = doc.splitTextToSize(cleanPdfText(page.textEn), 174);
    doc.text(englishText, 18, englishY, { lineHeightFactor: 1.3 });
  }

  addLicenseFooter(doc, story, customer, pageIndex + 2);
}

function addGlossaryPages(doc: jsPDF, story: Story, customer: CustomerInfo, firstPageNumber: number) {
  if (!story.glossary?.length) return;

  let pageNumber = firstPageNumber;
  let y = 52;
  const startPage = () => {
    doc.addPage();
    doc.setFillColor(246, 242, 233);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(37, 78, 57);
    doc.text('Kamus Kecil Cerita', SAFE_MARGIN, 27);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(103, 95, 81);
    doc.text('Kosakata pilihan untuk dibaca dan dipelajari bersama.', SAFE_MARGIN, 36);
    y = 52;
  };

  startPage();
  story.glossary.forEach((item) => {
    if (y > 258) {
      addLicenseFooter(doc, story, customer, pageNumber);
      pageNumber += 1;
      startPage();
    }
    doc.setFillColor(255, 253, 248);
    doc.setDrawColor(224, 217, 203);
    doc.roundedRect(SAFE_MARGIN, y, PAGE_WIDTH - SAFE_MARGIN * 2, 26, 4, 4, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(43, 83, 59);
    doc.text(cleanPdfText(item.wordEn), SAFE_MARGIN + 7, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(66, 61, 53);
    const phonetic = item.phonetic ? ` [${cleanPdfText(item.phonetic)}]` : '';
    doc.text(`${cleanPdfText(item.translationId)}${phonetic}`, SAFE_MARGIN + 7, y + 19);
    y += 31;
  });
  addLicenseFooter(doc, story, customer, pageNumber);
}

/** Generates a print-ready illustrated storybook PDF with a personal license stamp. */
export async function generateStoryPDF(story: Story, customer: CustomerInfo): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title: cleanPdfText(story.title),
    author: cleanPdfText(story.author),
    subject: 'Buku cerita anak BacaYuk',
    creator: 'BacaYuk',
  });

  const [cover, ...pageImages] = await Promise.all([
    loadPrintableImage(story.coverImage),
    ...story.pages.map((page) => loadPrintableImage(page.imageUrl)),
  ]);

  addCover(doc, story, customer, cover);
  story.pages.forEach((_, index) => addStoryPage(doc, story, customer, index, pageImages[index]));
  addGlossaryPages(doc, story, customer, story.pages.length + 2);
  return doc.output('blob');
}

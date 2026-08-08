import jsPDF from 'jspdf';
import { Story } from '../types';

export interface CustomerInfo {
  name: string;
  email: string;
  transactionId: string;
}

/**
 * Generates a high-quality printable PDF with cover, page illustrations/text, 
 * page numbers, and Social Watermark (Digital Stamping) at the bottom corner of every page.
 */
export async function generateStoryPDF(story: Story, customer: CustomerInfo): Promise<Blob> {
  // A4 dimensions in mm: 210 x 297
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const watermarkText = `🔒 LISENSI DIGITAL RESMI: ${customer.name} (${customer.email}) | ID Pesanan #${customer.transactionId} | Dilarang memperbanyak/menyebarkan tanpa izin.`;

  // Helper to add footer watermark to page
  const addWatermark = (pageNum: number, totalPagesNum: number) => {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    
    // Top header line
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, 15, pageWidth - margin, 15);
    doc.text(`Buku Cerita Anak Interaktif: ${story.title}`, margin, 11);
    doc.text(`Halaman ${pageNum} dari ${totalPagesNum}`, pageWidth - margin, 11, { align: 'right' });

    // Bottom Footer Watermark line
    const footerY = pageHeight - 12;
    doc.setDrawColor(235, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 50, 50); // Reddish watermark tint to discourage unauthorized sharing
    doc.text(watermarkText, pageWidth / 2, footerY, { align: 'center' });
  };

  // --- 1. COVER PAGE ---
  // Background cover accent box
  doc.setFillColor(252, 248, 238); // Soft warm amber
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative border
  doc.setDrawColor(217, 119, 6); // Amber border
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');

  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.8);
  doc.rect(13, 13, pageWidth - 26, pageHeight - 26, 'S');

  // Cover Category Badge
  doc.setFillColor(217, 119, 6);
  doc.rect(pageWidth / 2 - 40, 35, 80, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(story.category.toUpperCase(), pageWidth / 2, 41.5, { align: 'center' });

  // Book Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(120, 53, 15); // Dark amber
  const splitTitle = doc.splitTextToSize(story.title, contentWidth);
  doc.text(splitTitle, pageWidth / 2, 65, { align: 'center' });

  // Story Description Box
  const descY = 65 + splitTitle.length * 10 + 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(75, 85, 99);
  const splitDesc = doc.splitTextToSize(story.description, contentWidth - 10);
  doc.text(splitDesc, pageWidth / 2, descY, { align: 'center' });

  // Target Age & Moral Value Box
  const moralY = descY + splitDesc.length * 6 + 15;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, moralY, contentWidth, 28, 4, 4, 'F');
  doc.setDrawColor(252, 211, 77);
  doc.roundedRect(margin, moralY, contentWidth, 28, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(146, 64, 14);
  doc.text(`Usia Sasaran: ${story.targetAge}`, margin + 6, moralY + 9);
  doc.text(`Pesan Moral Utama:`, margin + 6, moralY + 17);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(120, 53, 15);
  const moralText = `"${story.moralMessage}"`;
  const splitMoral = doc.splitTextToSize(moralText, contentWidth - 12);
  doc.text(splitMoral, margin + 6, moralY + 23);

  // Bottom Stamp Box on Cover
  doc.setFillColor(239, 68, 68);
  doc.rect(margin, pageHeight - 35, contentWidth, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`HAK CIPTA TERLINDUNGI & DIGITAL WATERMARK`, pageWidth / 2, pageHeight - 27, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Dilisensikan Khusus Kepada: ${customer.name} (${customer.email})`, pageWidth / 2, pageHeight - 21, { align: 'center' });

  // --- 2. STORY PAGES ---
  const totalPagesNum = story.pages.length + 1;

  for (let i = 0; i < story.pages.length; i++) {
    const pageObj = story.pages[i];
    doc.addPage();

    // Soft background tint for inner reading pages
    doc.setFillColor(255, 253, 248);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Page Number Badge
    doc.setFillColor(245, 158, 11);
    doc.circle(pageWidth - 25, 30, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`${pageObj.pageNumber}`, pageWidth - 25, 33.5, { align: 'center' });

    // Page Illustration Banner Box
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin, 25, contentWidth - 15, 65, 6, 6, 'F');
    doc.setDrawColor(251, 191, 36);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, 25, contentWidth - 15, 65, 6, 6, 'S');

    // Illustration Title / Scene Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(180, 83, 9);
    doc.text(`Ilustrasi Adegan Halaman ${pageObj.pageNumber}`, pageWidth / 2 - 8, 42, { align: 'center' });

    // Interactive elements preview or text summary inside illustration frame
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(120, 53, 15);
    const subText = pageObj.quizQuestion ? `Kuis Interaktif: "${pageObj.quizQuestion.question}"` : `Cerita Bergambar Seri ${story.category}`;
    doc.text(subText, pageWidth / 2 - 8, 52, { align: 'center' });

    // Key interactive element labels inside frame
    if (pageObj.interactiveElements && pageObj.interactiveElements.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const elemsList = pageObj.interactiveElements.map(e => `• ${e.label} (${e.soundType})`).join('   ');
      doc.text(`Elemen Suara Interaktif: ${elemsList}`, pageWidth / 2 - 8, 65, { align: 'center' });
    }

    // Story Text Content Section (Indonesian)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59); // Slate-800 for high legibility
    
    const splitStoryText = doc.splitTextToSize(pageObj.text, contentWidth);
    doc.text(splitStoryText, margin, 105, {
      align: 'left',
      lineHeightFactor: 1.5,
    });

    // Bilingual English Text Section if available
    if (pageObj.textEn) {
      const enY = 105 + splitStoryText.length * 6 + 6;
      doc.setFillColor(238, 242, 255); // Indigo light
      doc.roundedRect(margin, enY, contentWidth, 24, 3, 3, 'F');
      doc.setDrawColor(199, 210, 254);
      doc.roundedRect(margin, enY, contentWidth, 24, 3, 3, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(67, 56, 202);
      doc.text(`🇬🇧 ENGLISH VERSION (EDISI BELAJAR BILINGUAL):`, margin + 4, enY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 27, 75);
      const splitEnText = doc.splitTextToSize(pageObj.textEn, contentWidth - 8);
      doc.text(splitEnText, margin + 4, enY + 13);
    }

    // Quiz Question Box at the bottom of page if present
    if (pageObj.quizQuestion) {
      const quizY = 195;
      doc.setFillColor(238, 242, 255); // Indigo light
      doc.roundedRect(margin, quizY, contentWidth, 42, 4, 4, 'F');
      doc.setDrawColor(199, 210, 254);
      doc.roundedRect(margin, quizY, contentWidth, 42, 4, 4, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(67, 56, 202);
      doc.text(`🧩 Kuis Pemahaman Halaman ${pageObj.pageNumber}:`, margin + 6, quizY + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(30, 27, 75);
      doc.text(pageObj.quizQuestion.question, margin + 6, quizY + 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      pageObj.quizQuestion.options.forEach((opt, idx) => {
        const optionLabel = `${String.fromCharCode(65 + idx)}. ${opt}`;
        const isCorrect = idx === pageObj.quizQuestion?.answerIndex;
        if (isCorrect) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(22, 101, 52); // Green correct answer text
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
        }
        doc.text(optionLabel, margin + (idx % 2 === 0 ? 6 : contentWidth / 2 + 2), quizY + 26 + Math.floor(idx / 2) * 7);
      });
    }

    // Add Security Watermark Footer
    addWatermark(i + 2, totalPagesNum);
  }

  // --- 3. PICTURE DICTIONARY SUPPLEMENT PAGE (Glosarium Kamus Bergambar) ---
  if (story.glossary && story.glossary.length > 0) {
    doc.addPage();
    doc.setFillColor(245, 243, 255); // Soft purple
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(76, 29, 149);
    doc.text(`📚 PICTURE DICTIONARY (KAMUS BERGAMBAR BILINGUAL)`, pageWidth / 2, 25, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(109, 40, 217);
    doc.text(`Kosakata Bahasa Inggris Pilihan Dari Cerita Ini Untuk Belajar Anak`, pageWidth / 2, 32, { align: 'center' });

    let itemY = 42;
    story.glossary.forEach((item, idx) => {
      if (itemY + 22 > pageHeight - 25) {
        doc.addPage();
        itemY = 25;
      }

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, itemY, contentWidth, 20, 3, 3, 'F');
      doc.setDrawColor(221, 214, 254);
      doc.roundedRect(margin, itemY, contentWidth, 20, 3, 3, 'S');

      // Emoji / Icon box
      doc.setFontSize(14);
      doc.text(item.emoji || '📖', margin + 6, itemY + 13);

      // Word EN
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(91, 33, 182);
      doc.text(`${item.wordEn}`, margin + 18, itemY + 10);

      if (item.phonetic) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(124, 58, 237);
        doc.text(`[${item.phonetic}]`, margin + 18 + doc.getTextWidth(item.wordEn) * 2.8 + 2, itemY + 10);
      }

      // Indonesian translation
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`= ${item.translationId}`, margin + 18, itemY + 16);

      itemY += 24;
    });

    addWatermark(story.pages.length + 2, totalPagesNum + 1);
  }

  return doc.output('blob');
}

/**
 * Generates an EPUB document (HTML-based structured e-book container) for mobile/tablet reader apps.
 */
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function uint32(value: number): Uint8Array {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ]);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function createStoredZip(entries: { path: string; content: string }[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const contentBytes = encoder.encode(entry.content);
    const checksum = crc32(contentBytes);
    const localHeader = concatBytes([
      uint32(0x04034b50),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(checksum),
      uint32(contentBytes.length),
      uint32(contentBytes.length),
      uint16(nameBytes.length),
      uint16(0),
      nameBytes,
    ]);

    localParts.push(localHeader, contentBytes);
    centralParts.push(
      concatBytes([
        uint32(0x02014b50),
        uint16(20),
        uint16(20),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(checksum),
        uint32(contentBytes.length),
        uint32(contentBytes.length),
        uint16(nameBytes.length),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(0),
        uint32(offset),
        nameBytes,
      ])
    );

    offset += localHeader.length + contentBytes.length;
  }

  const centralDirectory = concatBytes(centralParts);
  return concatBytes([
    ...localParts,
    centralDirectory,
    concatBytes([
      uint32(0x06054b50),
      uint16(0),
      uint16(0),
      uint16(entries.length),
      uint16(entries.length),
      uint32(centralDirectory.length),
      uint32(offset),
      uint16(0),
    ]),
  ]);
}

export async function generateStoryEPUB(story: Story, customer: CustomerInfo): Promise<Blob> {
  const safeTitle = escapeHtml(story.title);
  const safeDescription = escapeHtml(story.description);
  const safeMoral = escapeHtml(story.moralMessage);
  const safeCustomerName = escapeHtml(customer.name);
  const safeCustomerEmail = escapeHtml(customer.email);
  const safeTransactionId = escapeHtml(customer.transactionId);
  const generatedDate = escapeHtml(new Date().toLocaleDateString('id-ID'));
  const chapterSections = story.pages
    .map((p) => {
      const quiz = p.quizQuestion
        ? `<section class="quiz-box"><h2>Kuis Pemahaman Halaman ${escapeHtml(p.pageNumber)}</h2><p><strong>${escapeHtml(
            p.quizQuestion.question
          )}</strong></p><ul>${p.quizQuestion.options.map((opt) => `<li>${escapeHtml(opt)}</li>`).join('')}</ul></section>`
        : '';

      return `<section class="page-card"><p class="page-number">Halaman ${escapeHtml(
        p.pageNumber
      )}</p><p>${escapeHtml(p.text)}</p>${quiz}<footer class="watermark-footer">Lisensi Digital: ${safeCustomerName} (${safeCustomerEmail}) - #${safeTransactionId} - Dilarang Memperbanyak</footer></section>`;
    })
    .join('');

  const chapterContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="id">
<head>
  <title>${safeTitle}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.8; color: #1e293b; background: #fffdfa; padding: 2rem; }
    .cover-container, .page-card { border: 2px solid #fef3c7; border-radius: 1rem; padding: 1.5rem; margin-bottom: 2rem; }
    .cover-container { text-align: center; background: #fef3c7; }
    .badge, .page-number { color: #92400e; font-weight: bold; text-transform: uppercase; }
    .quiz-box { margin-top: 1rem; padding: 1rem; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 0.75rem; }
    .watermark-footer { margin-top: 1rem; border-top: 1px dashed #fca5a5; padding-top: 0.75rem; color: #dc2626; font-size: 0.8rem; font-style: italic; }
  </style>
</head>
<body>
  <section class="cover-container">
    <p class="badge">${escapeHtml(story.category)}</p>
    <h1>${safeTitle}</h1>
    <p>${safeDescription}</p>
    <p><strong>Pesan Moral:</strong> ${safeMoral}</p>
    <footer class="watermark-footer">Lisensi Digital Resmi Kepada: <strong>${safeCustomerName}</strong> (${safeCustomerEmail})<br />ID Transaksi: #${safeTransactionId} | Tanggal: ${generatedDate}</footer>
  </section>
  ${chapterSections}
</body>
</html>`;

  const containerXml = `<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`;
  const packageOpf = `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">urn:uuid:${safeTransactionId}-${escapeHtml(story.id)}</dc:identifier><dc:title>${safeTitle}</dc:title><dc:language>id</dc:language><dc:creator>${escapeHtml(story.author)}</dc:creator></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="chapter"/></spine></package>`;
  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="id"><head><title>Daftar Isi</title></head><body><nav epub:type="toc"><h1>Daftar Isi</h1><ol><li><a href="chapter.xhtml">${safeTitle}</a></li></ol></nav></body></html>`;
  const epubBytes = createStoredZip([
    { path: 'mimetype', content: 'application/epub+zip' },
    { path: 'META-INF/container.xml', content: containerXml },
    { path: 'OEBPS/package.opf', content: packageOpf },
    { path: 'OEBPS/nav.xhtml', content: navXhtml },
    { path: 'OEBPS/chapter.xhtml', content: chapterContent },
  ]);

  return new Blob([epubBytes], { type: 'application/epub+zip' });
}

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
export async function generateStoryEPUB(story: Story, customer: CustomerInfo): Promise<Blob> {
  const epubHtmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${story.title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Georgia, serif;
      line-height: 1.8;
      color: #1e293b;
      background-color: #fffdfa;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .cover-container {
      text-align: center;
      padding: 3rem 1rem;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border-radius: 1.5rem;
      border: 3px solid #f59e0b;
      margin-bottom: 3rem;
    }
    .badge {
      display: inline-block;
      padding: 0.3rem 1rem;
      background: #d97706;
      color: white;
      font-weight: bold;
      border-radius: 999px;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    h1 {
      color: #78350f;
      font-size: 2.2rem;
      margin: 1rem 0;
    }
    .page-card {
      background: white;
      border: 2px solid #fef3c7;
      border-radius: 1.25rem;
      padding: 2rem;
      margin-bottom: 2.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .page-number {
      display: inline-block;
      font-weight: font-black;
      color: #b45309;
      background: #fef3c7;
      padding: 0.2rem 0.8rem;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    .story-text {
      font-size: 1.15rem;
      color: #334155;
    }
    .quiz-box {
      margin-top: 1.5rem;
      padding: 1rem 1.25rem;
      background: #eef2ff;
      border-radius: 0.75rem;
      border: 1px solid #c7d2fe;
    }
    .quiz-title {
      font-weight: bold;
      color: #4338ca;
      font-size: 0.95rem;
    }
    .watermark-footer {
      margin-top: 1.5rem;
      padding-top: 0.75rem;
      border-top: 1px dashed #fca5a5;
      font-size: 0.75rem;
      color: #dc2626;
      text-align: center;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="cover-container">
    <div class="badge">${story.category}</div>
    <h1>${story.title}</h1>
    <p style="color: #4b5563; font-style: italic;">${story.description}</p>
    <p><strong>Pesan Moral:</strong> "${story.moralMessage}"</p>
    <div class="watermark-footer">
      🔒 DILISENSIKAN RESMI KEPADA: <strong>${customer.name}</strong> (${customer.email})<br>
      ID Transaksi: #${customer.transactionId} | Tanggal: ${new Date().toLocaleDateString('id-ID')}
    </div>
  </div>

  ${story.pages
    .map(
      (p) => `
    <div class="page-card">
      <div class="page-number">Halaman ${p.pageNumber}</div>
      <div class="story-text">
        <p>${p.text}</p>
      </div>

      ${
        p.quizQuestion
          ? `
        <div class="quiz-box">
          <div class="quiz-title">🧩 Kuis Pemahaman Halaman ${p.pageNumber}:</div>
          <p><strong>${p.quizQuestion.question}</strong></p>
          <ul>
            ${p.quizQuestion.options.map((opt) => `<li>${opt}</li>`).join('')}
          </ul>
        </div>
      `
          : ''
      }

      <div class="watermark-footer">
        🔒 Lisensi Digital: ${customer.name} (${customer.email}) — #${customer.transactionId} — Dilarang Memperbanyak
      </div>
    </div>
  `
    )
    .join('')}
</body>
</html>`;

  return new Blob([epubHtmlContent], { type: 'application/epub+zip' });
}

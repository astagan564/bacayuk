import type { Story } from '@/types';
import type { CustomerInfo } from '@/features/commerce/download/types';
import { escapeHtml } from '@/features/commerce/download/html';
import { createStoredZip } from '@/features/commerce/download/storedZip';

export async function generateStoryEPUB(story: Story, customer: CustomerInfo): Promise<Blob> {
  const safeTitle = escapeHtml(story.title);
  const safeDescription = escapeHtml(story.description);
  const safeMoral = escapeHtml(story.moralMessage);
  const safeCustomerName = escapeHtml(customer.name);
  const safeCustomerEmail = escapeHtml(customer.email);
  const safeTransactionId = escapeHtml(customer.transactionId);
  const generatedDate = escapeHtml(new Date().toLocaleDateString('id-ID'));
  const chapterSections = story.pages.map((page) => {
    const quiz = page.quizQuestion
      ? `<section class="quiz-box"><h2>Kuis Pemahaman Halaman ${escapeHtml(page.pageNumber)}</h2><p><strong>${escapeHtml(
          page.quizQuestion.question,
        )}</strong></p><ul>${page.quizQuestion.options.map((option) => `<li>${escapeHtml(option)}</li>`).join('')}</ul></section>`
      : '';
    return `<section class="page-card"><p class="page-number">Halaman ${escapeHtml(
      page.pageNumber,
    )}</p><p>${escapeHtml(page.text)}</p>${quiz}<footer class="watermark-footer">Lisensi Digital: ${safeCustomerName} (${safeCustomerEmail}) - #${safeTransactionId} - Dilarang Memperbanyak</footer></section>`;
  }).join('');

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

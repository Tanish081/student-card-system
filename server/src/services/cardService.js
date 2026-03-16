import PDFDocument from 'pdfkit';
import { generateStudentVerificationQrPng } from './qrService.js';

const streamToBuffer = (doc) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

export const generateStudentCardPdf = async ({ student, spi, topAchievements, participationSummary }) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const bufferPromise = streamToBuffer(doc);

  const schoolName = process.env.SCHOOL_NAME || 'Government Senior Secondary School';
  const cardTitle = 'Student Achievement Card';
  const pageWidth = doc.page.width;
  const cardX = 35;
  const cardY = 35;
  const cardWidth = pageWidth - 70;

  const safeAchievements = Array.isArray(topAchievements) ? topAchievements.slice(0, 3) : [];
  const achievementCount = Number(participationSummary?.achievementCount || safeAchievements.length);
  const participationCount = Number(participationSummary?.total || 0);

  doc.lineWidth(1.2).roundedRect(cardX, cardY, cardWidth, 760, 8).stroke('#1f2937');

  const headerY = cardY + 15;
  doc.rect(cardX + 1, headerY, cardWidth - 2, 90).fill('#f3f4f6');
  doc.fillColor('#111827');

  doc.lineWidth(1).rect(cardX + 15, headerY + 12, 58, 58).stroke('#4b5563');
  doc.fontSize(9).text('SCHOOL', cardX + 29, headerY + 34);
  doc.fontSize(9).text('LOGO', cardX + 33, headerY + 46);

  doc.font('Helvetica-Bold').fontSize(17).text(schoolName, cardX + 90, headerY + 20, {
    width: cardWidth - 180,
    align: 'center'
  });
  doc.fontSize(13).text(cardTitle, cardX + 90, headerY + 50, {
    width: cardWidth - 180,
    align: 'center'
  });

  const infoY = headerY + 115;
  doc.lineWidth(1).rect(cardX + 15, infoY, cardWidth - 30, 170).stroke('#374151');
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('Student Information', cardX + 25, infoY + 10);

  doc.rect(cardX + 28, infoY + 35, 95, 110).stroke('#6b7280');
  doc.font('Helvetica').fontSize(9).text('PHOTO', cardX + 63, infoY + 86, { align: 'center' });

  const detailsX = cardX + 145;
  doc.font('Helvetica').fontSize(11);
  doc.text(`Name: ${student.name}`, detailsX, infoY + 40);
  doc.text(`UID: ${student.uid}`, detailsX, infoY + 62);
  doc.text(`Class: ${student.class}`, detailsX, infoY + 84);
  doc.text(`Section: ${student.section}`, detailsX, infoY + 106);
  doc.text(`Admission Year: ${student.admissionYear}`, detailsX, infoY + 128);

  const performanceY = infoY + 185;
  doc.rect(cardX + 15, performanceY, cardWidth - 30, 100).stroke('#374151');
  doc.font('Helvetica-Bold').fontSize(12).text('Performance Summary', cardX + 25, performanceY + 10);
  doc.font('Helvetica').fontSize(11);
  doc.text(`SPI Score: ${spi?.spi ?? 0} (${spi?.category || 'N/A'})`, cardX + 30, performanceY + 40);
  doc.text(`Achievement Count: ${achievementCount}`, cardX + 30, performanceY + 62);
  doc.text(`Participation Count: ${participationCount}`, cardX + 280, performanceY + 62);

  const highlightsY = performanceY + 115;
  doc.rect(cardX + 15, highlightsY, cardWidth - 30, 170).stroke('#374151');
  doc.font('Helvetica-Bold').fontSize(12).text('Achievement Highlights (Top 3)', cardX + 25, highlightsY + 10);
  doc.font('Helvetica').fontSize(10.5);

  if (safeAchievements.length) {
    safeAchievements.forEach((item, index) => {
      doc.text(
        `${index + 1}. ${item.eventName} | ${item.level} | ${item.position} | ${item.points} pts`,
        cardX + 30,
        highlightsY + 40 + index * 36,
        { width: cardWidth - 60 }
      );
    });
  } else {
    doc.text('No approved achievements available.', cardX + 30, highlightsY + 55);
  }

  const footerY = highlightsY + 185;
  doc.rect(cardX + 15, footerY, cardWidth - 30, 110).stroke('#374151');
  doc.font('Helvetica-Bold').fontSize(12).text('Verification', cardX + 25, footerY + 10);

  const qrBuffer = await generateStudentVerificationQrPng({ uid: student.uid });
  doc.image(qrBuffer, cardX + 30, footerY + 25, { fit: [72, 72] });

  doc.font('Helvetica').fontSize(10.5).text('Scan QR to verify student record', cardX + 120, footerY + 45);
  doc.fontSize(9).fillColor('#374151').text('Public route: /verify/:uid', cardX + 120, footerY + 64);

  doc.fillColor('#111827');

  doc.end();
  return bufferPromise;
};

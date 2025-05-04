import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

// Escape and draw helpers stay the same
function escapeText(str) {
  if (!str || typeof str !== 'string') return 'N/A';
  return str.replace(/[\n\r\t]/g, ' ').trim();
}
function setFont(doc, fontName, fallback = 'Times-Roman') {
  try {
    doc.font(fontName);
  } catch {
    doc.font(fallback);
  }
}
function drawTableRow(doc, y, cells, isHeader, columnWidths, rowHeight, colors) {
  const textOptions = { fontSize: isHeader ? 10 : 9, lineGap: 2 };
  cells.forEach((cell, i) => {
    const x = 50 + columnWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
    setFont(doc, isHeader ? 'Helvetica-Bold' : 'Helvetica', 'Times-Roman');
    doc.fontSize(textOptions.fontSize).fillColor(isHeader ? '#FFFFFF' : '#000000').text(cell, x + 5, y + 5, {
      width: columnWidths[i] - 10,
      align: i < 3 ? 'center' : 'left',
    });
    doc.rect(x, y, columnWidths[i], rowHeight)
      .fillAndStroke(isHeader ? colors.header : colors.row, '#000000')
      .stroke();
  });
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { groupedSchedule } = data;
    if (!Array.isArray(groupedSchedule)) {
      return NextResponse.json({ error: 'Invalid schedule' }, { status: 400 });
    }

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    const streamChunks = [];
    doc.on('data', (chunk) => streamChunks.push(chunk));
    doc.on('end', () => console.log('PDF finished'));

    // HEADER
    setFont(doc, 'Helvetica-Bold', 'Times-Roman');
    doc.fontSize(18).text('INTERNATIONAL ISLAMIC UNIVERSITY', 50, 50, { align: 'center' });
    doc.fontSize(14).text(escapeText(data.departmentName?.toUpperCase() || 'DEPARTMENT'), 50, 80, { align: 'center' });
    doc.fontSize(12).text(`${escapeText(data.examPeriod)} DATESHEET ${escapeText(data.academicYear)}`, 50, 100, { align: 'center' });
    doc.fontSize(10).text(`Duration: ${escapeText(data.startDate)} -- ${escapeText(data.endDate)}`, 50, 120, { align: 'center' });
    doc.fontSize(10).text(`Version Release Date: ${escapeText(data.versionReleaseDate)}`, 50, 135, { align: 'center' });

    // TABLE
    const columnWidths = [100, 80, 60, 120, 150, 80, 100];
    const rowHeight = 25;
    let y = 170;
    const colors = {
      header: '#2F5496',
      rowEven: '#E6E6E6',
      rowOdd: '#E6F0FA',
    };

    drawTableRow(doc, y, ['Date (Day)', 'Time', 'Semester', 'Course', 'Instructor(s)', 'Batch', 'Room(s)'], true, columnWidths, rowHeight, colors);
    y += rowHeight;

    groupedSchedule.forEach((group, gi) => {
      group.exams.forEach((exam, ei) => {
        const cells = [
          ei === 0 ? escapeText(group.date) : '',
          ei === 0 ? escapeText(group.time) : '',
          ei === 0 ? escapeText(group.semester) : '',
          escapeText(`${exam.courseCode || ''} ${exam.courseName || 'Unknown'}`),
          exam.roomAssignments?.map(r => r.facultyName || 'Unknown').join(', ') || 'TBD',
          escapeText(group.batchName || 'Unknown'),
          exam.roomAssignments?.map(r => r.roomName || 'Unknown').join(', ') || 'TBD',
        ];
        drawTableRow(doc, y, cells, false, columnWidths, rowHeight, { ...colors, row: gi % 2 === 0 ? colors.rowEven : colors.rowOdd });
        y += rowHeight;

        if (y > doc.page.height - 50) {
          doc.addPage();
          y = 50;
          drawTableRow(doc, y, ['Date (Day)', 'Time', 'Semester', 'Course', 'Instructor(s)', 'Batch', 'Room(s)'], true, columnWidths, rowHeight, colors);
          y += rowHeight;
        }
      });
    });

    doc.end();

    const pdfBuffer = await new Promise((resolve) => {
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="datesheet_${data.name || 'export'}.pdf"`,
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}

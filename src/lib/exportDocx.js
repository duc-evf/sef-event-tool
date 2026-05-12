import {
  Document, Packer, Table, TableRow, TableCell, Paragraph, TextRun,
  WidthType, BorderStyle, AlignmentType, ExternalHyperlink,
} from 'docx';
import { saveAs } from 'file-saver';

function boldCell(text) {
  return new TableCell({
    width: { size: 30, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
  });
}

function valueCell(text, width = 70) {
  const paragraphs = (text || '').split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('•') || trimmed.startsWith('- ')) {
      return new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun(trimmed.replace(/^[•\-]\s*/, ''))],
      });
    }
    return new Paragraph({ children: [new TextRun(trimmed)] });
  });
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    children: paragraphs.length ? paragraphs : [new Paragraph('')],
  });
}

function linkCell(url) {
  if (!url) return valueCell('');
  return new TableCell({
    width: { size: 70, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        children: [
          new ExternalHyperlink({
            link: url,
            children: [new TextRun({ text: url, style: 'Hyperlink' })],
          }),
        ],
      }),
    ],
  });
}

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1 },
  bottom: { style: BorderStyle.SINGLE, size: 1 },
  left: { style: BorderStyle.SINGLE, size: 1 },
  right: { style: BorderStyle.SINGLE, size: 1 },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
  insideVertical: { style: BorderStyle.SINGLE, size: 1 },
};

export async function generateEventReportDOCX(eventInfo, eventReport, participants) {
  const now = new Date();
  const dates = eventInfo.event_dates?.start
    ? `${eventInfo.event_dates.start}${eventInfo.event_dates.end ? ' – ' + eventInfo.event_dates.end : ''}`
    : '';

  const sefParticipants = participants.length
    ? participants.join(', ')
    : (Array.isArray(eventInfo.colleague_name) ? eventInfo.colleague_name.join(', ') : eventInfo.colleague_name);

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: [
      new TableRow({ children: [boldCell('Event name'), valueCell(eventInfo.event_name)] }),
      new TableRow({ children: [boldCell('Dates'), valueCell(dates)] }),
      new TableRow({ children: [boldCell('Organizer'), valueCell(eventInfo.event_organiser)] }),
      new TableRow({ children: [boldCell('Website'), linkCell(eventInfo.event_website)] }),
      new TableRow({ children: [boldCell('SEF participant(s)'), valueCell(sefParticipants)] }),
      new TableRow({ children: [boldCell('ESA participant(s)'), valueCell(eventReport.esa_participants)] }),
      new TableRow({ children: [boldCell('SEF role'), valueCell(eventReport.sef_role)] }),
      new TableRow({ children: [boldCell('Materials presented'), valueCell(eventReport.materials_presented)] }),
    ],
  });

  const sections = [
    ['Rationale for attendance', eventReport.rationale],
    ['Key messages from this event', eventReport.key_messages],
    ['Key stakeholders encountered', eventReport.key_stakeholders],
    ['Area for SEF follow on', eventReport.follow_on],
    ['Lessons learned', eventReport.lessons_learned],
    ['Any other points', eventReport.other_points],
  ];

  const bodyTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: sections.map(([label, content]) =>
      new TableRow({ children: [boldCell(label), valueCell(content)] })
    ),
  });

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({ text: 'Event Report', bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
        headerTable,
        new Paragraph({ spacing: { before: 300, after: 300 } }),
        bodyTable,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (eventInfo.event_name || 'event').replace(/[^a-zA-Z0-9]/g, '_');
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
  saveAs(blob, `${yyyymmdd}-event-report-${safeName}.docx`);
}

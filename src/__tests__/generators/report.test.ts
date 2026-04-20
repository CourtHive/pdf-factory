import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { generateReportPDF } from '../../generators/report';

import type { ReportColumn } from '../../generators/report';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

const sampleColumns: ReportColumn[] = [
  { key: 'name', title: 'Participant', type: 'string' },
  { key: 'event', title: 'Event', type: 'string' },
  { key: 'status', title: 'Entry Status', type: 'string' },
  { key: 'ranking', title: 'Ranking', type: 'number' },
];

const sampleRows = [
  { name: 'Alice Johnson', event: 'Singles', status: 'DIRECT_ACCEPTANCE', ranking: 5 },
  { name: 'Bob Smith', event: 'Singles', status: 'WILDCARD', ranking: 12 },
  { name: 'Carol Lee', event: 'Doubles', status: 'DIRECT_ACCEPTANCE', ranking: 3 },
  { name: 'David Chen', event: 'Singles', status: 'QUALIFIER', ranking: 25 },
  { name: 'Eva Martinez', event: 'Doubles', status: 'DIRECT_ACCEPTANCE', ranking: 8 },
];

describe('Report PDF Generator', () => {
  it('generates a valid PDF from columns and rows', () => {
    const doc = generateReportPDF(sampleColumns, sampleRows);
    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);

    writeFileSync(resolve(OUTPUT_DIR, 'report-basic.pdf'), Buffer.from(pdfBytes));
  });

  it('generates PDF with tournament header', () => {
    const doc = generateReportPDF(sampleColumns, sampleRows, {
      header: {
        tournamentName: 'Test Open 2026',
        startDate: '2026-04-19',
        endDate: '2026-04-26',
        location: 'Melbourne, Australia',
      },
      title: 'Entry Status Report',
    });

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);

    writeFileSync(resolve(OUTPUT_DIR, 'report-with-header.pdf'), Buffer.from(pdfBytes));
  });

  it('generates PDF with title only (no header)', () => {
    const doc = generateReportPDF(sampleColumns, sampleRows, {
      title: 'Venue Utilization',
    });

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
  });

  it('generates landscape PDF', () => {
    const wideColumns: ReportColumn[] = [
      ...sampleColumns,
      { key: 'draw', title: 'Draw', type: 'string' },
      { key: 'seeding', title: 'Seeding', type: 'number' },
      { key: 'wtn', title: 'WTN', type: 'number' },
    ];
    const wideRows = sampleRows.map((r) => ({ ...r, draw: 'Main', seeding: 0, wtn: 15.5 }));

    const doc = generateReportPDF(wideColumns, wideRows, { orientation: 'landscape' });
    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
  });

  it('handles empty rows', () => {
    const doc = generateReportPDF(sampleColumns, []);
    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
  });

  it('handles empty columns', () => {
    const doc = generateReportPDF([], sampleRows);
    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
  });
});

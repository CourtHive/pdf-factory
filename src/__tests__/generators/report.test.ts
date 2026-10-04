import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { generateReportPDF, buildReportColumnStyles } from '../../generators/report';

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

describe('buildReportColumnStyles', () => {
  // The exact Call Timing Variance report shape that rendered horribly.
  const callTimingColumns: ReportColumn[] = [
    { key: 'venueName', title: 'Venue', type: 'string', fitData: true },
    { key: 'eventName', title: 'Event', type: 'string', fitData: true },
    { key: 'matchUp', title: 'MatchUp', type: 'string' },
    { key: 'scheduledDate', title: 'Date', type: 'date', fitData: true, width: 110 },
    { key: 'varianceMinutes', title: 'Variance (min)', type: 'number', width: 90 },
  ];

  it('scales pixel widths into sane mm — not raw (110px → ~29mm, not 110mm)', () => {
    const styles = buildReportColumnStyles(callTimingColumns);
    expect(styles.scheduledDate.cellWidth).toBeCloseTo(29.1, 0);
    expect(styles.varianceMinutes.cellWidth).toBeCloseTo(23.8, 0);
    // The two fixed columns together must fit well within a landscape A4's
    // usable width (~267mm) — the old raw-mm path put them at 200mm.
    expect(styles.scheduledDate.cellWidth + styles.varianceMinutes.cellWidth).toBeLessThan(60);
  });

  it('maps fitData columns to content-fit (wrap), not a fixed collapse', () => {
    const styles = buildReportColumnStyles(callTimingColumns);
    expect(styles.venueName.cellWidth).toBe('wrap');
    expect(styles.eventName.cellWidth).toBe('wrap');
  });

  it('leaves the one flexible column (no width, no fitData) unstyled so it absorbs slack', () => {
    const styles = buildReportColumnStyles(callTimingColumns);
    expect(styles.matchUp).toBeUndefined();
  });

  it('right-aligns number columns', () => {
    const styles = buildReportColumnStyles(callTimingColumns);
    expect(styles.varianceMinutes.halign).toBe('right');
  });

  it('width takes precedence over fitData when both are present', () => {
    const styles = buildReportColumnStyles([{ key: 'scheduledDate', title: 'Date', fitData: true, width: 110 }]);
    expect(styles.scheduledDate.cellWidth).toBeCloseTo(29.1, 0);
  });
});

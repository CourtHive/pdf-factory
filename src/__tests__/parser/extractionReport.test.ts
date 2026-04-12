import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { parsePdfBuffer, type PdfPage } from '../../parser/pdfExtractor';
import { extractDrawFromPage, type ExtractedDrawData } from '../../parser/drawExtractor';
import { hasFixtures, REFERENCE_DIR } from '../fixtureGuard';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe.skipIf(!hasFixtures)('Extraction report — dump what we can extract from each reference PDF', () => {
  const pdfs = [
    { file: 'wimbledon_ms.pdf', name: 'Wimbledon MS' },
    { file: 'usopen_ms.pdf', name: 'US Open MS' },
    { file: 'ao_ws.pdf', name: 'Australian Open WS' },
    { file: 'rg_ws.pdf', name: 'Roland Garros WS' },
    { file: 'serbian_draw.pdf', name: 'Serbian Draw' },
    { file: 'usopen_xd.pdf', name: 'US Open XD' },
    { file: 'wta_dubai_ws.pdf', name: 'WTA Dubai WS' },
    { file: 'wta_rome_ws.pdf', name: 'WTA Rome WS' },
    { file: 'wta_indianwells_wd.pdf', name: 'WTA Indian Wells WD' },
    { file: 'lta_32_consolation.pdf', name: 'LTA 32 Consolation (blank)' },
    { file: 'lta_16_compass.pdf', name: 'LTA 16 Compass (blank)' },
    { file: 'atp_draw1.pdf', name: 'ATP Draw 1' },
    { file: 'protennislive_draw1.pdf', name: 'ProTennisLive Draw 1' },
  ];

  it('generates extraction report for all reference PDFs', { timeout: 60000 }, async () => {
    const report: string[] = ['# PDF Extraction Report\n'];

    for (const { file, name } of pdfs) {
      const pdfPath = resolve(REFERENCE_DIR, file);
      if (!existsSync(pdfPath)) {
        report.push(`## ${name}\nFile not found: ${file}\n`);
        continue;
      }

      const buffer = readFileSync(pdfPath);
      const parsed = await parsePdfBuffer(buffer);

      report.push(`## ${name} (${file})`);
      report.push(`Pages: ${parsed.pages.length}`);

      for (let p = 0; p < parsed.pages.length; p++) {
        appendPageReport(report, parsed.pages[p], p);
      }
      report.push('\n---\n');
    }

    const reportText = report.join('\n');
    writeFileSync(resolve(OUTPUT_DIR, 'extraction-report.md'), reportText);
    expect(reportText.length).toBeGreaterThan(100);
  });
});

function appendPageReport(report: string[], page: PdfPage, pageIndex: number): void {
  const extracted = extractDrawFromPage(page);

  report.push(`\n### Page ${pageIndex + 1}`);
  report.push(`Text items: ${page.texts.length}, HLines: ${page.hLines.length}, VLines: ${page.vLines.length}`);
  report.push(`Tournament: ${extracted.tournamentName || 'N/A'}`);
  report.push(`Event: ${extracted.eventName || 'N/A'}`);
  report.push(`Round labels: ${extracted.roundLabels.join(', ') || 'none detected'}`);
  report.push(`Participants: ${extracted.participants.length}`);
  report.push(`Scores: ${extracted.matchUps.length}`);

  appendParticipantSummary(report, extracted);
  appendScoreSummary(report, extracted);
}

function appendParticipantSummary(report: string[], extracted: ExtractedDrawData): void {
  if (extracted.participants.length === 0) return;
  report.push('\nFirst 10 participants:');
  for (const part of extracted.participants.slice(0, 10)) {
    const seed = part.seedValue ? ` [${part.seedValue}]` : '';
    const nat = part.nationalityCode ? ` ${part.nationalityCode}` : '';
    const pos = part.drawPosition ? `#${part.drawPosition}` : '';
    report.push(`  ${pos} ${part.familyName}, ${part.givenName}${seed}${nat}`);
  }
}

function appendScoreSummary(report: string[], extracted: ExtractedDrawData): void {
  if (extracted.matchUps.length === 0) return;
  report.push('\nFirst 10 scores:');
  for (const mu of extracted.matchUps.slice(0, 10)) {
    report.push(`  ${mu.score}`);
  }
}

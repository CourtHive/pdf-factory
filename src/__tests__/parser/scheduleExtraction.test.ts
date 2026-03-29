import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { parsePdfBuffer } from '../../parser/pdfExtractor';
import { detectRegions } from '../../parser/regionDetector';
import { classifyText } from '../../parser/textAnalyzer';

const REFERENCE_DIR = resolve(__dirname, '../../../fixtures/reference');
const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe('Schedule/OOP extraction from reference PDFs', () => {
  it('extracts structure from J300 OOP', async () => {
    const pdfPath = resolve(REFERENCE_DIR, 'j300_oop.pdf');
    if (!existsSync(pdfPath)) return;

    const buffer = readFileSync(pdfPath);
    const parsed = await parsePdfBuffer(buffer);

    expect(parsed.pages.length).toBeGreaterThanOrEqual(1);

    const report: string[] = ['# J300 OOP Extraction Report\n'];

    for (let p = 0; p < parsed.pages.length; p++) {
      const page = parsed.pages[p];
      const regions = detectRegions(page);

      report.push(`## Page ${p + 1}`);
      report.push(`Text items: ${page.texts.length}`);
      report.push(`HLines: ${page.hLines.length}, VLines: ${page.vLines.length}`);
      report.push(`Header items: ${regions.header.items.length}`);
      report.push(`Content items: ${regions.content.items.length}`);
      report.push(`Footer items: ${regions.footer.items.length}`);

      // Classify content items
      const typeCounts: Record<string, number> = {};
      const playerNames: string[] = [];
      const scores: string[] = [];
      const roundLabels: string[] = [];

      for (const item of regions.content.items) {
        const c = classifyText(item.text, item.x, item.y);
        typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;

        if (c.type === 'player-name') playerNames.push(item.text);
        if (c.type === 'score') scores.push(item.text);
        if (c.type === 'round-label') roundLabels.push(item.text);
      }

      report.push(`\nType counts: ${JSON.stringify(typeCounts)}`);
      report.push(`\nPlayer names found: ${playerNames.length}`);
      if (playerNames.length > 0) {
        report.push(
          playerNames
            .slice(0, 10)
            .map((n) => `  - ${n}`)
            .join('\n'),
        );
      }
      report.push(`\nScores found: ${scores.length}`);
      if (scores.length > 0) {
        report.push(
          scores
            .slice(0, 10)
            .map((s) => `  - ${s}`)
            .join('\n'),
        );
      }
      report.push(`\nRound labels: ${roundLabels.join(', ')}`);

      // Header analysis
      report.push('\nHeader text:');
      for (const item of regions.header.items) {
        report.push(`  (${item.x.toFixed(1)}, ${item.y.toFixed(1)}) "${item.text}"`);
      }

      report.push('\n---\n');
    }

    writeFileSync(resolve(OUTPUT_DIR, 'j300-oop-extraction.md'), report.join('\n'));
    expect(parsed.pages.length).toBeGreaterThan(0);
  });

  it('extracts from WTA Miami qualifying OOP', async () => {
    const pdfPath = resolve(REFERENCE_DIR, 'wta_miami_qs.pdf');
    if (!existsSync(pdfPath)) return;

    const buffer = readFileSync(pdfPath);
    const parsed = await parsePdfBuffer(buffer);
    const page = parsed.pages[0];
    const regions = detectRegions(page);

    // Count content types
    const typeCounts: Record<string, number> = {};
    for (const item of regions.content.items) {
      const c = classifyText(item.text, item.x, item.y);
      typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
    }

    writeFileSync(resolve(OUTPUT_DIR, 'wta-miami-qs-types.json'), JSON.stringify(typeCounts, null, 2));

    expect(page.texts.length).toBeGreaterThan(20);
  });
});

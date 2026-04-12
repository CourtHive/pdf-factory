import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { parsePdfBuffer } from '../../parser/pdfExtractor';
import { classifyText } from '../../parser/textAnalyzer';
import { detectRegions } from '../../parser/regionDetector';
import { hasFixtures, REFERENCE_DIR } from '../fixtureGuard';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe.skipIf(!hasFixtures)('Australian Open debug', () => {
  it('dumps AO text items to understand format', async () => {
    const pdfPath = resolve(REFERENCE_DIR, 'ao_ws.pdf');
    if (!existsSync(pdfPath)) return;

    const buffer = readFileSync(pdfPath);
    const parsed = await parsePdfBuffer(buffer);
    const page = parsed.pages[0];
    const regions = detectRegions(page);

    // Dump content area items with classification
    const dump = regions.content.items.map((t, i) => {
      const c = classifyText(t.text, t.x, t.y);
      return `${i}: (${t.x.toFixed(1)}, ${t.y.toFixed(1)}) [${c.type} ${c.confidence}] bold=${t.isBold} fontSize=${t.fontSize} "${t.text}"`;
    });

    writeFileSync(resolve(OUTPUT_DIR, 'ao-text-dump.txt'), dump.join('\n'));

    // Count by type
    const typeCounts: Record<string, number> = {};
    for (const t of regions.content.items) {
      const c = classifyText(t.text, t.x, t.y);
      typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
    }

    writeFileSync(resolve(OUTPUT_DIR, 'ao-type-counts.txt'), JSON.stringify(typeCounts, null, 2));

    // Show AO has HLines/VLines (ReportLab generates these)
    const linesDump = page.hLines
      .slice(0, 20)
      .map((l) => `  x=${l.x.toFixed(1)} y=${l.y.toFixed(1)} len=${l.length.toFixed(1)}`);
    const linesText = `HLines: ${page.hLines.length}\nVLines: ${page.vLines.length}\n\nFirst 20 HLines:\n${linesDump.join('\n')}`;
    writeFileSync(resolve(OUTPUT_DIR, 'ao-lines.txt'), linesText);

    expect(page.texts.length).toBeGreaterThan(50);
  });
});

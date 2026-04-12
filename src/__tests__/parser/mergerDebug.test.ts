import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { parsePdfBuffer } from '../../parser/pdfExtractor';
import { mergeTextItems } from '../../parser/textMerger';
import { detectRegions } from '../../parser/regionDetector';
import { hasFixtures, REFERENCE_DIR } from '../fixtureGuard';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe.skipIf(!hasFixtures)('Merger debug', () => {
  it('dumps merged text items from WTA Dubai content area', async () => {
    const pdfPath = resolve(REFERENCE_DIR, 'wta_dubai_ws.pdf');
    if (!existsSync(pdfPath)) return;

    const buffer = readFileSync(pdfPath);
    const parsed = await parsePdfBuffer(buffer);
    const page = parsed.pages[0];
    const regions = detectRegions(page);

    const merged = mergeTextItems(regions.content.items);

    const dump = merged.slice(0, 80).map((m, i) => {
      const fragCount = m.fragments.length;
      return `${i}: row=${m.row} (${m.x.toFixed(1)}) bold=${m.isBold} frags=${fragCount} "${m.text}"`;
    });

    writeFileSync(resolve(OUTPUT_DIR, 'wta-dubai-merged-dump.txt'), dump.join('\n'));
    expect(merged.length).toBeGreaterThan(50);
  });
});

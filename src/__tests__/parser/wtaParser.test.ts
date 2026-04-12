import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { parsePdfBuffer } from '../../parser/pdfExtractor';
import { classifyText } from '../../parser/textAnalyzer';
import { extractDrawMerged } from '../../parser/drawExtractor';
import { hasFixtures, REFERENCE_DIR } from '../fixtureGuard';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe.skipIf(!hasFixtures)('WTA PDF text analysis', () => {
  it('dumps raw text items from WTA Dubai to understand the format', async () => {
    const pdfPath = resolve(REFERENCE_DIR, 'wta_dubai_ws.pdf');
    if (!existsSync(pdfPath)) return;

    const buffer = readFileSync(pdfPath);
    const parsed = await parsePdfBuffer(buffer);
    const page = parsed.pages[0];

    // Dump first 100 text items with positions to understand the layout
    const dump = page.texts.slice(0, 150).map((t, i) => {
      const classified = classifyText(t.text, t.x, t.y);
      return `${i}: (${t.x.toFixed(1)}, ${t.y.toFixed(1)}) [${classified.type}] bold=${t.isBold} "${t.text}"`;
    });

    writeFileSync(resolve(OUTPUT_DIR, 'wta-dubai-text-dump.txt'), dump.join('\n'));

    // Find items that look like they have seed numbers concatenated with names
    const seedNameItems = page.texts.filter((t) => /^\d+[A-Z]/.test(t.text));
    if (seedNameItems.length > 0) {
      console.log(
        'Concatenated seed+name items:',
        seedNameItems.slice(0, 10).map((t) => `"${t.text}"`),
      );
    }

    // Find items that start with a number and are followed by a capital letter
    const prefixedItems = page.texts.filter((t) => /^\d{1,2}\s*[A-Z]{2,}/.test(t.text.trim()));
    if (prefixedItems.length > 0) {
      console.log(
        'Number-prefixed names:',
        prefixedItems.slice(0, 10).map((t) => `"${t.text}"`),
      );
    }

    expect(page.texts.length).toBeGreaterThan(100);
  });

  it('parses seed-prefixed name patterns from WTA format', () => {
    // WTA format: "1SABALENKA, Aryna" or "1 SABALENKA, Aryna"
    const testCases = [
      { input: '1SABALENKA, Aryna', expectedFamily: 'SABALENKA', expectedSeed: 1 },
      { input: '16MUCHOVA, Karolina', expectedFamily: 'MUCHOVA', expectedSeed: 16 },
      { input: 'RYBAKINA, Elena', expectedFamily: 'RYBAKINA', expectedSeed: null },
      { input: '3GAUFF, Coco', expectedFamily: 'GAUFF', expectedSeed: 3 },
    ];

    for (const tc of testCases) {
      const result = parseWtaEntry(tc.input);
      if (tc.expectedSeed) {
        expect(result?.seedValue, `seed for "${tc.input}"`).toEqual(tc.expectedSeed);
      }
      if (result) {
        expect(result.familyName, `name for "${tc.input}"`).toEqual(tc.expectedFamily);
      }
    }
  });
});

describe.skipIf(!hasFixtures)('WTA merged extraction', () => {
  it('extracts more participants using merged text from WTA Dubai', async () => {
    const pdfPath = resolve(REFERENCE_DIR, 'wta_dubai_ws.pdf');
    if (!existsSync(pdfPath)) return;

    const buffer = readFileSync(pdfPath);
    const parsed = await parsePdfBuffer(buffer);

    // Standard extraction (fragmented)
    const { extractDrawFromPage } = await import('../../parser/drawExtractor');
    const standard = extractDrawFromPage(parsed.pages[0]);

    // Merged extraction
    const merged = extractDrawMerged(parsed.pages[0]);

    console.log(`Standard extraction: ${standard.participants.length} participants`);
    console.log(`Merged extraction: ${merged.participants.length} participants`);

    // Merged should find more participants
    expect(merged.participants.length).toBeGreaterThanOrEqual(standard.participants.length);

    // Should find SABALENKA correctly
    const sabalenka = merged.participants.find((p) => p.familyName === 'SABALENKA');
    expect(sabalenka).toBeDefined();

    // Dump merged results for inspection
    const report = merged.participants.map((p, i) => {
      const seed = p.seedValue ? ` [${p.seedValue}]` : '';
      return `${i + 1}. ${p.familyName}, ${p.givenName}${seed}`;
    });
    writeFileSync(resolve(OUTPUT_DIR, 'wta-dubai-merged-participants.txt'), report.join('\n'));
  });
});

function parseWtaEntry(text: string): { familyName: string; givenName: string; seedValue?: number } | null {
  // Pattern: optional seed number directly before uppercase name
  const match = text.match(/^(\d{1,2})?\s*([A-Z][A-Z'-]+),?\s*([A-Za-z][A-Za-z'-]*(?:\s+[A-Za-z][A-Za-z'-]*)?)/);
  if (!match) return null;

  return {
    familyName: match[2],
    givenName: match[3] || '',
    seedValue: match[1] ? parseInt(match[1]) : undefined,
  };
}

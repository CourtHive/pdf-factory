import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { parsePdfBuffer } from '../../parser/pdfExtractor';
import { extractDrawFromPage } from '../../parser/drawExtractor';
import { hasFixtures, REFERENCE_DIR } from '../fixtureGuard';

describe.skipIf(!hasFixtures)('Draw Extractor — PDF to structured data', () => {
  it('extracts participants from wimbledon MS page 1', async () => {
    const pdfPath = resolve(REFERENCE_DIR, 'wimbledon_ms.pdf');
    if (!existsSync(pdfPath)) return;

    const buffer = readFileSync(pdfPath);
    const parsed = await parsePdfBuffer(buffer);
    const extracted = extractDrawFromPage(parsed.pages[0]);

    // Wimbledon MS page 1 should have ~64 participants (top half)
    expect(extracted.participants.length).toBeGreaterThan(20);

    // Should find SINNER (seed 1)
    const sinner = extracted.participants.find((p) => p.familyName === 'SINNER');
    expect(sinner).toBeDefined();
    expect(sinner?.givenName).toContain('Jannik');

    // Should extract some scores
    expect(extracted.matchUps.length).toBeGreaterThan(0);

    // Should have tournament name from header
    expect(extracted.tournamentName).toBeDefined();

    console.log(`Extracted ${extracted.participants.length} participants from Wimbledon page 1`);
    console.log(`Found ${extracted.matchUps.length} scores`);
    console.log(`Round labels: ${extracted.roundLabels.join(', ')}`);
    console.log(`Tournament: ${extracted.tournamentName}`);
  });

  it('extracts participants from US Open MS page 1', async () => {
    const pdfPath = resolve(REFERENCE_DIR, 'usopen_ms.pdf');
    if (!existsSync(pdfPath)) return;

    const buffer = readFileSync(pdfPath);
    const parsed = await parsePdfBuffer(buffer);
    const extracted = extractDrawFromPage(parsed.pages[0]);

    expect(extracted.participants.length).toBeGreaterThan(20);

    const sinner = extracted.participants.find((p) => p.familyName === 'SINNER');
    expect(sinner).toBeDefined();

    console.log(`Extracted ${extracted.participants.length} participants from US Open page 1`);
    console.log(`Found ${extracted.matchUps.length} scores`);
  });

  it('extracts participants from australian open WS', async () => {
    const pdfPath = resolve(REFERENCE_DIR, 'ao_ws.pdf');
    if (!existsSync(pdfPath)) return;

    const buffer = readFileSync(pdfPath);
    const parsed = await parsePdfBuffer(buffer);
    const extracted = extractDrawFromPage(parsed.pages[0]);

    expect(extracted.participants.length).toBeGreaterThan(10);

    // Should find SABALENKA
    const sabalenka = extracted.participants.find((p) => p.familyName === 'SABALENKA');
    expect(sabalenka).toBeDefined();

    console.log(`Extracted ${extracted.participants.length} participants from Australian Open page 1`);
  });

  it('extracts participants from serbian draw', async () => {
    const pdfPath = resolve(REFERENCE_DIR, 'serbian_draw.pdf');
    if (!existsSync(pdfPath)) return;

    const buffer = readFileSync(pdfPath);
    const parsed = await parsePdfBuffer(buffer);
    const extracted = extractDrawFromPage(parsed.pages[0]);

    expect(extracted.participants.length).toBeGreaterThan(0);

    console.log(`Extracted ${extracted.participants.length} participants from Serbian draw`);
    console.log(
      'First 5:',
      extracted.participants.slice(0, 5).map((p) => `${p.familyName}, ${p.givenName}`),
    );
  });
});

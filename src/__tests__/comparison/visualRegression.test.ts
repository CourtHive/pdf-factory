import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { comparePdfToSnapshot, comparetwoPdfs } from '../../comparison/visualCompare';
import { extractDrawData } from '../../core/extractDrawData';
import { renderTraditionalDraw } from '../../renderers/traditionalDraw';
import { createDoc, getPageRegions } from '../../composition/page';
import { renderHeader } from '../../composition/headerLayouts';
import { renderFooter, measureFooterHeight } from '../../composition/footerLayouts';
import { getPreset } from '../../config/formatPresets';
import { readFileSync, existsSync } from 'fs';
import { hasFixtures } from '../fixtureGuard';

const SNAPSHOTS_DIR = resolve(__dirname, '../__snapshots__/pdf');
const OUTPUT_DIR = resolve(__dirname, '../__output__/comparison');

function generateDraw(drawSize: number, presetName: string, seedsCount: number): Buffer {
  mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize, eventName: 'Singles', seedsCount }],
    completeAllMatchUps: true,
    setState: true,
    nonRandom: true,
  });

  const format = getPreset(presetName);
  const events: any = tournamentEngine.getEvents();
  const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
  const participants: any = tournamentEngine.getParticipants({
    participantFilters: { participantTypes: ['INDIVIDUAL'] },
  });
  const drawData = extractDrawData({ drawDefinition, participants: participants.participants || [] });

  const doc = createDoc({ ...format.page, orientation: 'landscape' }, drawSize);
  const footerConfig = { layout: 'standard' as const, showPageNumbers: true, showTimestamp: false };
  const footerH = measureFooterHeight(footerConfig);
  const headerH = renderHeader(
    doc,
    { layout: 'itf', tournamentName: 'Snapshot Test', subtitle: `${presetName} ${drawSize}`, startDate: '2026-01-01' },
    format.page,
  );
  const regions = getPageRegions(doc, format.page, headerH, footerH);
  renderTraditionalDraw(doc, drawData, format, regions);
  renderFooter(doc, footerConfig, format.page, 1);

  return Buffer.from(doc.output('arraybuffer'));
}

describe.skipIf(!hasFixtures)('Visual regression snapshots', () => {
  it('creates or compares snapshot for 32-draw ITF', async () => {
    const pdfBuffer = generateDraw(32, 'itfJunior', 8);

    const results = await comparePdfToSnapshot(pdfBuffer, {
      snapshotsDir: SNAPSHOTS_DIR,
      snapshotName: 'trad-32-itf',
      scale: 1.5,
      threshold: 0.15,
    });

    for (const r of results) {
      if (r.snapshotCreated) {
        // First run — snapshot created, nothing to compare
        expect(r.snapshotCreated).toBe(true);
      } else {
        // nonRandom + no timestamp = deterministic PDFs; small rasterization variance from pdf-to-img
        expect(r.mismatchPercent).toBeLessThan(2);
      }
    }
  });

  it('creates or compares snapshot for 16-draw Wimbledon', async () => {
    const pdfBuffer = generateDraw(16, 'wimbledon', 4);

    const results = await comparePdfToSnapshot(pdfBuffer, {
      snapshotsDir: SNAPSHOTS_DIR,
      snapshotName: 'trad-16-wimbledon',
      scale: 1.5,
      threshold: 0.15,
    });

    for (const r of results) {
      if (!r.snapshotCreated) {
        expect(r.mismatchPercent).toBeLessThan(2);
      }
    }
  });
});

describe.skipIf(!hasFixtures)('Cross-preset comparison', () => {
  it('compares Wimbledon vs Roland Garros 32-draw rendering', async () => {
    const wimbledon = generateDraw(32, 'wimbledon', 8);
    const rg = generateDraw(32, 'rolandGarros', 8);

    const results = await comparetwoPdfs(wimbledon, rg, OUTPUT_DIR, 'wimbledon-32', 'rg-32');

    // These should differ significantly (different name formats, score separators)
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      if (r.mismatchedPixels >= 0) {
        // They should not be identical (different formats)
        expect(r.mismatchedPixels).toBeGreaterThan(0);
      }
    }
  });
});

describe.skipIf(!hasFixtures)('Reference PDF comparison', () => {
  it('generates fidelity comparison: our 64-draw vs Wimbledon reference', async () => {
    const refPath = resolve(__dirname, '../../../fixtures/reference/wimbledon_ms.pdf');
    if (!existsSync(refPath)) return;

    const generated = generateDraw(64, 'wimbledon', 16);
    const reference = readFileSync(refPath);

    const results = await comparetwoPdfs(
      generated,
      reference,
      resolve(OUTPUT_DIR, 'fidelity-wimbledon'),
      'generated',
      'reference',
    );

    // They will differ significantly — this is a fidelity tracking metric
    expect(results.length).toBeGreaterThan(0);

    // Log the mismatch for tracking improvement over time
    for (const r of results) {
      if (r.mismatchPercent >= 0) {
        console.log(`Wimbledon fidelity page ${r.page}: ${r.mismatchPercent.toFixed(1)}% mismatch`);
      }
    }
  });
});

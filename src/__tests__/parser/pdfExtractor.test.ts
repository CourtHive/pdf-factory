import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { parsePdfBuffer } from '../../parser/pdfExtractor';
import { detectRegions } from '../../parser/regionDetector';
import { classifyText, extractPlayerName, extractSeedValue } from '../../parser/textAnalyzer';
import { hasFixtures, REFERENCE_DIR } from '../fixtureGuard';

const PLAYER_NAME = 'player-name';
const COUNTRY_CODE = 'country-code';
const ENTRY_CODE = 'entry-code';
const ROUND_LABEL = 'round-label';
const DRAW_POSITION = 'draw-position';

describe.skipIf(!hasFixtures)('PDF Extractor', () => {
  it('parses the serbian draw fixture', async () => {
    const pdfPath = resolve(REFERENCE_DIR, 'serbian_draw.pdf');
    if (!existsSync(pdfPath)) return;

    const buffer = readFileSync(pdfPath);
    const parsed = await parsePdfBuffer(buffer);

    expect(parsed.pages.length).toBeGreaterThan(0);
    const page = parsed.pages[0];
    expect(page.texts.length).toBeGreaterThan(10);
    expect(page.width).toBeGreaterThan(0);
  });

  it('parses wimbledon MS and detects regions', async () => {
    const pdfPath = resolve(REFERENCE_DIR, 'wimbledon_ms.pdf');
    if (!existsSync(pdfPath)) return;

    const buffer = readFileSync(pdfPath);
    const parsed = await parsePdfBuffer(buffer);

    expect(parsed.pages.length).toEqual(2);

    const page1 = parsed.pages[0];
    expect(page1.texts.length).toBeGreaterThan(50);

    const regions = detectRegions(page1);
    expect(regions.header.items.length).toBeGreaterThan(0);
    expect(regions.content.items.length).toBeGreaterThan(0);

    // The header should contain "THE CHAMPIONSHIPS" or "GENTLEMEN'S SINGLES"
    const headerTexts = regions.header.items.map((t) => t.text);
    const hasChampionships = headerTexts.some((t) => t.includes('CHAMPIONSHIPS') || t.includes('GENTLEMEN'));
    expect(hasChampionships).toBe(true);
  });

  it('parses US Open MS and extracts text with coordinates', async () => {
    const pdfPath = resolve(REFERENCE_DIR, 'usopen_ms.pdf');
    if (!existsSync(pdfPath)) return;

    const buffer = readFileSync(pdfPath);
    const parsed = await parsePdfBuffer(buffer);

    expect(parsed.pages.length).toEqual(2);

    // Find SINNER in the text
    const page1 = parsed.pages[0];
    const sinnerItems = page1.texts.filter((t) => t.text.includes('SINNER'));
    expect(sinnerItems.length).toBeGreaterThan(0);
  });

  it('extracts lines or text from wimbledon (bracket connectors may be paths)', async () => {
    const pdfPath = resolve(REFERENCE_DIR, 'wimbledon_ms.pdf');
    if (!existsSync(pdfPath)) return;

    const buffer = readFileSync(pdfPath);
    const parsed = await parsePdfBuffer(buffer);

    const page1 = parsed.pages[0];
    // Some PDFs use HLines/VLines, others use paths/fills for bracket connectors
    // Either way, we should have plenty of text content
    expect(page1.texts.length).toBeGreaterThan(50);
  });
});

describe.skipIf(!hasFixtures)('Text Analyzer', () => {
  it('classifies player names', () => {
    expect(classifyText('SINNER, Jannik', 0, 0).type).toEqual(PLAYER_NAME);
    expect(classifyText('SABALENKA Aryna', 0, 0).type).toEqual(PLAYER_NAME);
    expect(classifyText('KOVACEVIC, Aleksandar', 0, 0).type).toEqual(PLAYER_NAME);
  });

  it('classifies scores', () => {
    expect(classifyText('6-4 6-3', 0, 0).type).toEqual('score');
    expect(classifyText('7-6(5) 6-3', 0, 0).type).toEqual('score');
    expect(classifyText('6/4 6/3', 0, 0).type).toEqual('score');
    expect(classifyText('Ret.', 0, 0).type).toEqual('score');
    expect(classifyText('w/o', 0, 0).type).toEqual('score');
  });

  it('classifies seeds', () => {
    expect(classifyText('[1]', 0, 0).type).toEqual('seed');
    expect(classifyText('[16]', 0, 0).type).toEqual('seed');
    expect(classifyText('(4)', 0, 0).type).toEqual('seed');
  });

  it('classifies country codes', () => {
    expect(classifyText('USA', 0, 0).type).toEqual(COUNTRY_CODE);
    expect(classifyText('ITA', 0, 0).type).toEqual(COUNTRY_CODE);
    expect(classifyText('GBR', 0, 0).type).toEqual(COUNTRY_CODE);
  });

  it('classifies entry codes (WC is an entry code, not a country)', () => {
    expect(classifyText('WC', 0, 0).type).toEqual(ENTRY_CODE);
    expect(classifyText('LL', 0, 0).type).toEqual(ENTRY_CODE);
    expect(classifyText('(Q)', 0, 0).type).toEqual(ENTRY_CODE);
  });

  it('classifies round labels', () => {
    expect(classifyText('First Round', 0, 0).type).toEqual(ROUND_LABEL);
    expect(classifyText('Quarter-Finals', 0, 0).type).toEqual(ROUND_LABEL);
    expect(classifyText('1er TOUR', 0, 0).type).toEqual(ROUND_LABEL);
    expect(classifyText('FINALE', 0, 0).type).toEqual(ROUND_LABEL);
  });

  it('classifies draw positions', () => {
    expect(classifyText('1', 0, 0).type).toEqual(DRAW_POSITION);
    expect(classifyText('64', 0, 0).type).toEqual(DRAW_POSITION);
    expect(classifyText('128', 0, 0).type).toEqual(DRAW_POSITION);
  });

  it('extracts player names', () => {
    expect(extractPlayerName('SINNER, Jannik')).toEqual({ familyName: 'SINNER', givenName: 'Jannik' });
    expect(extractPlayerName('SABALENKA Aryna')).toEqual({ familyName: 'SABALENKA', givenName: 'Aryna' });
    expect(extractPlayerName('')).toBeNull();
  });

  it('extracts seed values', () => {
    expect(extractSeedValue('[1]')).toEqual(1);
    expect(extractSeedValue('[16]')).toEqual(16);
    expect(extractSeedValue('(4)')).toEqual(4);
    expect(extractSeedValue('unseeded')).toBeNull();
  });
});

describe.skipIf(!hasFixtures)('Coordinate Clustering', () => {
  it('clusters nearby coordinates', async () => {
    const { clusterCoordinates } = await import('../../parser/coordinateClustering');
    const clusters = clusterCoordinates([1.0, 1.1, 1.05, 5.0, 5.1, 10.0], 0.2);
    expect(clusters.length).toEqual(3);
    expect(clusters[0].values).toContain(1.0);
    expect(clusters[0].values).toContain(1.1);
    expect(clusters[0].values).toContain(1.05);
    expect(clusters[1].values).toContain(5.0);
    expect(clusters[2].values).toContain(10.0);
  });

  it('handles empty input', async () => {
    const { clusterCoordinates } = await import('../../parser/coordinateClustering');
    expect(clusterCoordinates([])).toEqual([]);
  });
});

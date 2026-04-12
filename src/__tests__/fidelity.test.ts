import { describe, it, expect } from 'vitest';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { hasFixtures, REFERENCE_DIR } from './fixtureGuard';
import { pdf } from 'pdf-to-img';

const OUTPUT_DIR = resolve(__dirname, '__output__/fidelity');
const GENERATED_DIR = resolve(__dirname, '__output__');

mkdirSync(OUTPUT_DIR, { recursive: true });

async function pdfToImages(pdfPath: string, prefix: string) {
  if (!existsSync(pdfPath)) return;
  const pdfBuffer = readFileSync(pdfPath);
  const pages = await pdf(pdfBuffer, { scale: 2.0 });
  let pageNum = 0;
  for await (const page of pages) {
    pageNum++;
    writeFileSync(resolve(OUTPUT_DIR, `${prefix}-page${pageNum}.png`), page);
  }
  return pageNum;
}

describe.skipIf(!hasFixtures)('Fidelity check: convert PDFs to images for visual inspection', () => {
  it('converts reference Wimbledon MS draw to images', async () => {
    const count = await pdfToImages(resolve(REFERENCE_DIR, 'wimbledon_ms.pdf'), 'ref-wimbledon-ms');
    expect(count).toBeGreaterThan(0);
  });

  it('converts reference US Open MS draw to images', async () => {
    const count = await pdfToImages(resolve(REFERENCE_DIR, 'usopen_ms.pdf'), 'ref-usopen-ms');
    expect(count).toBeGreaterThan(0);
  });

  it('converts reference Australian Open WS draw to images', async () => {
    const count = await pdfToImages(resolve(REFERENCE_DIR, 'ao_ws.pdf'), 'ref-ao-ws');
    expect(count).toBeGreaterThan(0);
  });

  it('converts reference J300 from TMX scratch', async () => {
    const j300Path = resolve(__dirname, '../../../TMX/scratch/PDF/J300 - BS Main Draw - Monday with results..pdf');
    if (existsSync(j300Path)) {
      const count = await pdfToImages(j300Path, 'ref-j300-draw');
      expect(count).toBeGreaterThan(0);
    }
  });

  it('converts our generated traditional-32-wimbledon to images', async () => {
    const count = await pdfToImages(resolve(GENERATED_DIR, 'traditional-32-wimbledon.pdf'), 'gen-trad-32-wimbledon');
    expect(count).toBeGreaterThan(0);
  });

  it('converts our generated traditional-16-itf to images', async () => {
    const count = await pdfToImages(resolve(GENERATED_DIR, 'traditional-16-itf.pdf'), 'gen-trad-16-itf');
    expect(count).toBeGreaterThan(0);
  });

  it('converts our generated round-robin-8 to images', async () => {
    const count = await pdfToImages(resolve(GENERATED_DIR, 'round-robin-8.pdf'), 'gen-rr-8');
    expect(count).toBeGreaterThan(0);
  });

  it('converts our generated lucky-draw-16 to images', async () => {
    const count = await pdfToImages(resolve(GENERATED_DIR, 'lucky-draw-16.pdf'), 'gen-lucky-16');
    expect(count).toBeGreaterThan(0);
  });

  it('converts our generated 64-split-wimbledon to images', async () => {
    const count = await pdfToImages(resolve(GENERATED_DIR, 'traditional-64-split-wimbledon.pdf'), 'gen-trad-64-split');
    expect(count).toBeGreaterThan(0);
  });
});

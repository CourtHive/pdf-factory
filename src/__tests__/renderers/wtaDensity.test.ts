import { describe, it, expect } from 'vitest';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractDrawData } from '../../core/extractDrawData';
import { renderTraditionalDraw } from '../../renderers/traditionalDraw';
import { renderSeedingsFooter, measureSeedingsHeight } from '../../composition/seedingsFooter';
import { createDoc, getPageRegions } from '../../composition/page';
import { renderHeader } from '../../composition/headerLayouts';
import { renderFooter, measureFooterHeight } from '../../composition/footerLayouts';
import { mergePreset } from '../../config/formatPresets';
import { comparetwoPdfs } from '../../comparison/visualCompare';
import { pdf } from 'pdf-to-img';

const SINGLES_MAIN_DRAW = 'Singles Main Draw';
const OUTPUT_DIR = resolve(__dirname, '../__output__');
const REFERENCE_DIR = resolve(__dirname, '../../../fixtures/reference');
mkdirSync(resolve(OUTPUT_DIR, 'fidelity'), { recursive: true });

describe('WTA-density portrait 64-draw', () => {
  it('renders 64-draw in portrait A4 (WTA Dubai style)', async () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 64, eventName: SINGLES_MAIN_DRAW, seedsCount: 16 }],
      completeAllMatchUps: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    const info: any = tournamentEngine.getTournamentInfo();
    const events: any = tournamentEngine.getEvents();
    const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
    const participants: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });
    const drawData = extractDrawData({ drawDefinition, participants: participants.participants || [] });

    // WTA style: portrait A4
    const format = mergePreset('wimbledon', {
      page: { pageSize: 'a4', orientation: 'portrait', margins: { top: 12, right: 8, bottom: 8, left: 8 } },
    });

    const doc = createDoc(format.page);
    const seedingsReserve = measureSeedingsHeight(drawData.seedAssignments.length);
    const footerH = seedingsReserve;

    const headerH = renderHeader(
      doc,
      {
        layout: 'grand-slam',
        tournamentName: info.tournamentInfo?.tournamentName || 'WTA 1000',
        subtitle: SINGLES_MAIN_DRAW,
        startDate: info.tournamentInfo?.startDate,
        location: 'Dubai, UAE',
      },
      format.page,
    );

    const regions = getPageRegions(doc, format.page, headerH, footerH);
    renderTraditionalDraw(doc, drawData, format, regions);

    // Render seedings table below the bracket
    const bracketBottom = regions.contentY + regions.contentHeight;
    renderSeedingsFooter(doc, drawData, format, bracketBottom + 1);

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'wta-portrait-64.pdf'), Buffer.from(pdfBytes));

    // Convert to PNG for inspection
    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/wta-portrait-64-page${pageNum}.png`), page);
    }
    expect(pageNum).toEqual(1);
  });

  it('compares our portrait 64 against WTA Dubai reference', async () => {
    const refPath = resolve(REFERENCE_DIR, 'wta_dubai_ws.pdf');
    const genPath = resolve(OUTPUT_DIR, 'wta-portrait-64.pdf');
    if (!existsSync(refPath) || !existsSync(genPath)) return;

    const generated = readFileSync(genPath);
    const reference = readFileSync(refPath);

    const results = await comparetwoPdfs(
      generated,
      reference,
      resolve(OUTPUT_DIR, 'comparison/fidelity-wta-dubai'),
      'generated',
      'reference',
    );

    expect(results.length).toBeGreaterThan(0);
  });

  it('renders 32-draw in portrait A4 (smaller WTA event)', async () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 32, eventName: SINGLES_MAIN_DRAW, seedsCount: 8 }],
      completeAllMatchUps: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    const events: any = tournamentEngine.getEvents();
    const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
    const participants: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });
    const drawData = extractDrawData({ drawDefinition, participants: participants.participants || [] });

    const format = mergePreset('wimbledon', {
      page: { pageSize: 'a4', orientation: 'portrait', margins: { top: 12, right: 8, bottom: 8, left: 8 } },
    });

    const doc = createDoc(format.page);
    const seedingsReserve = 20;
    const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true }) + seedingsReserve;

    const headerH = renderHeader(
      doc,
      { layout: 'grand-slam', tournamentName: 'WTA 250', subtitle: SINGLES_MAIN_DRAW },
      format.page,
    );

    const regions = getPageRegions(doc, format.page, headerH, footerH);
    renderTraditionalDraw(doc, drawData, format, regions);

    const bracketBottom = regions.contentY + regions.contentHeight;
    renderSeedingsFooter(doc, drawData, format, bracketBottom + 2);
    renderFooter(doc, { layout: 'standard', showTimestamp: true }, format.page, 1);

    const pdfBytes = doc.output('arraybuffer');
    writeFileSync(resolve(OUTPUT_DIR, 'wta-portrait-32.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/wta-portrait-32-page${pageNum}.png`), page);
    }
    expect(pageNum).toEqual(1);
  });
});

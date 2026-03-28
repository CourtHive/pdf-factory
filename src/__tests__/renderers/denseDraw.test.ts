import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractDrawData } from '../../core/extractDrawData';
import { renderTraditionalDraw } from '../../renderers/traditionalDraw';
import { createDoc, getPageRegions } from '../../composition/page';
import { renderHeader } from '../../composition/headerLayouts';
import { renderFooter, measureFooterHeight } from '../../composition/footerLayouts';
import { getPreset } from '../../config/formatPresets';
import { pdf } from 'pdf-to-img';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe('Dense single-page draws', () => {
  it('renders 64-draw on a single landscape A4 page (Wimbledon density)', async () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 64, eventName: 'Singles', seedsCount: 16 }],
      completeAllMatchUps: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    const format = getPreset('wimbledon');
    const events: any = tournamentEngine.getEvents();
    const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
    const participants: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });
    const drawData = extractDrawData({ drawDefinition, participants: participants.participants || [] });

    // Force landscape A4
    const doc = createDoc({ ...format.page, orientation: 'landscape' }, 64);
    const footerH = measureFooterHeight({ layout: 'standard', showPageNumbers: true, showTimestamp: true });
    const headerH = renderHeader(
      doc,
      {
        layout: 'grand-slam',
        tournamentName: 'Wimbledon 2025',
        subtitle: "Gentlemen's Singles",
        startDate: '30 Jun 2025',
        location: 'London, England',
      },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerH, footerH);
    renderTraditionalDraw(doc, drawData, format, regions);
    renderFooter(doc, { layout: 'standard', showPageNumbers: true, showTimestamp: true }, format.page, 1);

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'dense-64-wimbledon.pdf'), Buffer.from(pdfBytes));

    // Convert to PNG for visual inspection
    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/dense-64-wimbledon-page${pageNum}.png`), page);
    }
    // Should be exactly 1 page
    expect(pageNum).toEqual(1);
  });

  it('renders 64-draw on single page with ITF header', async () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 64, eventName: 'Boys Singles', seedsCount: 16 }],
      completeAllMatchUps: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    const format = getPreset('itfJunior');
    const events: any = tournamentEngine.getEvents();
    const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
    const participants: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });
    const drawData = extractDrawData({ drawDefinition, participants: participants.participants || [] });

    const doc = createDoc({ ...format.page, orientation: 'landscape' }, 64);
    const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true });
    const headerH = renderHeader(
      doc,
      {
        layout: 'itf',
        tournamentName: 'J300 Tucson',
        subtitle: 'Boys Singles - Main Draw',
        startDate: '09 Mar 2026',
        location: 'Tucson, USA',
        grade: 'J300',
        supervisor: 'Douglas Rice',
      },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerH, footerH);
    renderTraditionalDraw(doc, drawData, format, regions);
    renderFooter(doc, { layout: 'standard', showTimestamp: true }, format.page, 1);

    const pdfBytes = doc.output('arraybuffer');
    writeFileSync(resolve(OUTPUT_DIR, 'dense-64-itf.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/dense-64-itf-page${pageNum}.png`), page);
    }
    expect(pageNum).toEqual(1);
  });
});

import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractCompassData } from '../../core/extractCompassData';
import { renderCompassDraw } from '../../renderers/compassDraw';
import { createDoc, getPageRegions } from '../../composition/page';
import { renderHeader } from '../../composition/headerLayouts';
import { measureFooterHeight } from '../../composition/footerLayouts';
import { getPreset } from '../../config/formatPresets';
import { pdf } from 'pdf-to-img';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(resolve(OUTPUT_DIR, 'fidelity'), { recursive: true });

describe('Compass draw renderer', () => {
  it('extracts and renders an 8-player compass draw', async () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 8, drawType: 'COMPASS', eventName: 'Compass Singles' }],
      completeAllMatchUps: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    const events: any = tournamentEngine.getEvents();
    const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
    expect(drawDefinition).toBeDefined();
    expect(drawDefinition.structures.length).toBeGreaterThan(1);

    const participants: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });

    const compassData = extractCompassData({ drawDefinition, participants: participants.participants || [] });
    expect(compassData.structures.length).toBeGreaterThan(1);
    expect(compassData.mainStructure).toBeDefined();

    const format = getPreset('itfJunior');
    const doc = createDoc(format.page, 8);
    const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true });
    const headerH = renderHeader(
      doc,
      { layout: 'itf', tournamentName: 'Club Championship', subtitle: 'Compass Draw' },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerH, footerH);

    renderCompassDraw(doc, compassData, format, regions);

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'compass-8.pdf'), Buffer.from(pdfBytes));

    // Convert to PNG
    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/compass-8-page${pageNum}.png`), page);
    }
    expect(pageNum).toBeGreaterThanOrEqual(1);
  });

  it('extracts and renders a 16-player compass draw', async () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 16, drawType: 'COMPASS', eventName: 'Compass Singles' }],
      completeAllMatchUps: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    const events: any = tournamentEngine.getEvents();
    const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
    const participants: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });

    const compassData = extractCompassData({ drawDefinition, participants: participants.participants || [] });

    const format = getPreset('usta');
    const doc = createDoc(format.page, 16);
    const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true });
    const headerH = renderHeader(
      doc,
      { layout: 'itf', tournamentName: 'USTA Sectional', subtitle: '16-Player Compass Draw' },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerH, footerH);

    renderCompassDraw(doc, compassData, format, regions);

    const pdfBytes = doc.output('arraybuffer');
    writeFileSync(resolve(OUTPUT_DIR, 'compass-16.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/compass-16-page${pageNum}.png`), page);
    }
  });

  it('handles empty compass data', () => {
    const data = extractCompassData({ drawDefinition: undefined, participants: [] });
    expect(data.structures).toEqual([]);
  });
});

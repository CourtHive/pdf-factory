import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractConsolationStructures, renderConsolationDraw } from '../../renderers/consolationDraw';
import { createDoc, getPageRegions } from '../../composition/page';
import { renderHeader } from '../../composition/headerLayouts';
import { measureFooterHeight } from '../../composition/footerLayouts';
import { getPreset } from '../../config/formatPresets';
import { pdf } from 'pdf-to-img';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(resolve(OUTPUT_DIR, 'fidelity'), { recursive: true });

describe('Consolation draw renderer', () => {
  it('renders a 16-draw with first match loser consolation', async () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 16, drawType: 'FIRST_MATCH_LOSER_CONSOLATION', eventName: 'Consolation Singles' }],
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

    const structures = extractConsolationStructures({ drawDefinition, participants: participants.participants || [] });
    expect(structures.length).toBeGreaterThan(1);

    const mainStructure = structures.find((s) => s.stage === 'MAIN');
    expect(mainStructure).toBeDefined();
    const consolationStructure = structures.find((s) => s.stage === 'CONSOLATION');
    expect(consolationStructure).toBeDefined();

    const format = getPreset('itfJunior');
    const doc = createDoc(format.page, 16);
    const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true });
    const headerH = renderHeader(
      doc,
      { layout: 'itf', tournamentName: 'Regional Championship', subtitle: 'Singles with Consolation' },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerH, footerH);

    renderConsolationDraw(doc, structures, format, regions);

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'consolation-16.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/consolation-16-page${pageNum}.png`), page);
    }
  });

  it('renders a 32-draw with feed-in championship', async () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 32, drawType: 'FEED_IN_CHAMPIONSHIP', eventName: 'FIC Singles', seedsCount: 8 }],
      completeAllMatchUps: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    const events: any = tournamentEngine.getEvents();
    const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
    const participants: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });

    const structures = extractConsolationStructures({ drawDefinition, participants: participants.participants || [] });

    const format = getPreset('usta');
    const doc = createDoc(format.page, 32);
    const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true });
    const headerH = renderHeader(
      doc,
      { layout: 'itf', tournamentName: 'USTA National', subtitle: 'Feed-In Championship' },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerH, footerH);

    renderConsolationDraw(doc, structures, format, regions);

    const pdfBytes = doc.output('arraybuffer');
    writeFileSync(resolve(OUTPUT_DIR, 'feed-in-championship-32.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/feed-in-championship-32-page${pageNum}.png`), page);
    }
  });

  it('handles empty consolation structures', () => {
    const structures = extractConsolationStructures({ drawDefinition: undefined, participants: [] });
    expect(structures).toEqual([]);
  });
});

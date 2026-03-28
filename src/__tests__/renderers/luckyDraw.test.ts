import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractDrawData } from '../../core/extractDrawData';
import { renderLuckyDraw } from '../../renderers/luckyDraw';
import { createDoc, getPageRegions } from '../../composition/page';
import { renderHeader } from '../../composition/headerLayouts';
import { measureFooterHeight } from '../../composition/footerLayouts';
import { mergePreset } from '../../config/formatPresets';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe('Lucky draw renderer', () => {
  it('renders a 16-draw as independent match boxes', () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 16, eventName: 'Lucky Draw', seedsCount: 0 }],
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
    const format = mergePreset('itfJunior', { renderStyle: 'lucky-draw' });

    const doc = createDoc(format.page, 16);
    const footerHeight = measureFooterHeight({ layout: 'standard', showPageNumbers: true, showTimestamp: true });
    const headerHeight = renderHeader(
      doc,
      { layout: 'minimal', tournamentName: 'Club Lucky Draw', subtitle: 'Singles' },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerHeight, footerHeight);

    renderLuckyDraw(doc, drawData, format, regions);

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'lucky-draw-16.pdf'), Buffer.from(pdfBytes));
  });
});

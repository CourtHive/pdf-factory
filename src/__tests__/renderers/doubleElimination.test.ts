import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractDrawData } from '../../core/extractDrawData';
import { renderDoubleEliminationDraw, type DoubleEliminationData } from '../../renderers/doubleEliminationDraw';
import { createDoc, getPageRegions } from '../../composition/page';
import { renderHeader } from '../../composition/headerLayouts';
import { measureFooterHeight } from '../../composition/footerLayouts';
import { getPreset } from '../../config/formatPresets';
import { pdf } from 'pdf-to-img';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(resolve(OUTPUT_DIR, 'fidelity'), { recursive: true });

const EMPTY_DRAW = {
  drawName: '',
  drawSize: 0,
  drawType: '',
  totalRounds: 0,
  slots: [],
  matchUps: [],
  seedAssignments: [],
};

function extractDoubleElimData(drawDefinition: any, participants: any[]): DoubleEliminationData {
  const structures = drawDefinition?.structures || [];
  const mainStruct = structures.find((s: any) => s.stage === 'MAIN');
  const consolationStruct = structures.find((s: any) => s.stage === 'CONSOLATION');
  const deciderStruct = structures.find((s: any) => s.stage === 'PLAY_OFF');

  return {
    winnersBracket: mainStruct
      ? extractDrawData({ drawDefinition, participants, structureId: mainStruct.structureId })
      : EMPTY_DRAW,
    losersBracket: consolationStruct
      ? extractDrawData({ drawDefinition, participants, structureId: consolationStruct.structureId })
      : EMPTY_DRAW,
    deciderMatch: deciderStruct
      ? extractDrawData({ drawDefinition, participants, structureId: deciderStruct.structureId })
      : undefined,
  };
}

describe('Double elimination renderer', () => {
  it('renders an 8-player double elimination draw', async () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 8, drawType: 'DOUBLE_ELIMINATION', eventName: 'Double Elim' }],
      completeAllMatchUps: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    const events: any = tournamentEngine.getEvents();
    const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
    expect(drawDefinition).toBeDefined();
    expect(drawDefinition.structures.length).toEqual(3);

    const participants: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });

    const data = extractDoubleElimData(drawDefinition, participants.participants || []);
    expect(data.winnersBracket.matchUps.length).toBeGreaterThan(0);
    expect(data.losersBracket.matchUps.length).toBeGreaterThan(0);
    expect(data.deciderMatch).toBeDefined();

    // Verify no BYEs in backdraw
    const backdrawByes = data.losersBracket.slots.filter((s) => s.isBye);
    expect(backdrawByes.length).toEqual(0);

    const format = getPreset('usta');
    const doc = createDoc({ ...format.page, orientation: 'landscape' }, 8);
    const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true });
    const headerH = renderHeader(
      doc,
      { layout: 'itf', tournamentName: 'Club Championship', subtitle: '8-Player Double Elimination' },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerH, footerH);

    renderDoubleEliminationDraw(doc, data, format, regions);

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'double-elim-8.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/double-elim-8-page${pageNum}.png`), page);
    }
  });

  it('renders a 16-player double elimination draw', async () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 16, drawType: 'DOUBLE_ELIMINATION', eventName: 'Double Elim' }],
      completeAllMatchUps: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    const events: any = tournamentEngine.getEvents();
    const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
    const participants: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });

    const data = extractDoubleElimData(drawDefinition, participants.participants || []);

    const format = getPreset('usta');
    const doc = createDoc({ ...format.page, orientation: 'landscape' }, 16);
    const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true });
    const headerH = renderHeader(
      doc,
      { layout: 'itf', tournamentName: 'Regional Championship', subtitle: '16-Player Double Elimination' },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerH, footerH);

    renderDoubleEliminationDraw(doc, data, format, regions);

    const pdfBytes = doc.output('arraybuffer');
    writeFileSync(resolve(OUTPUT_DIR, 'double-elim-16.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/double-elim-16-page${pageNum}.png`), page);
    }
  });
});
